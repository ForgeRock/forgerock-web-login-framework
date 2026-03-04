# BFF Server

A stateless cookie-based Backend-for-Frontend (BFF) that proxies authentication between a SvelteKit UI and ForgeRock Access Management (AM). All session state lives in AES-256-GCM encrypted cookies — no server-side session store — so the BFF scales horizontally with zero shared state. Built with [Effect-TS](https://effect.website) for typed errors, structured logging, and composable service layers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  +page.svelte                                               │ │
│  │  Renders callback inputs from cookie-stored step data       │ │
│  │  POSTs FormData via SvelteKit form actions                  │ │
│  └──────────────────────┬──────────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────────┘
                          │  POST FormData (form action)
                          │  Cookies: __aid, __step, __session
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  BFF (SvelteKit + Effect)                                       │
│                                                                 │
│  hooks.server.ts ── security headers (skipped for /e2e), runtime │
│                                                                 │
│  +page.server.ts ── form actions (init / step)                  │
│    1. Unseal cookies → recover authId + step callbacks           │
│    2. Merge FormData into AM callback structure                  │
│    3. POST to AM /authenticate                                  │
│    4. Seal new state into encrypted cookies                      │
│    5. Return step data (or auth-complete signal) to page         │
│                                                                 │
│  /api/* routes ── OAuth + session endpoints                     │
│    authorize → tokens → userinfo → revoke → end-session         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  ForgeRock Access Management                                    │
│  /json/realms/.../authenticate    (authentication trees)        │
│  /oauth2/realms/.../authorize     (OAuth 2.0 / OIDC)           │
│  /oauth2/realms/.../access_token  (token exchange)              │
│  /oauth2/realms/.../userinfo      (user profile)                │
│  /oauth2/realms/.../token/revoke  (token revocation)            │
│  /oauth2/realms/.../connect/endSession (RP-initiated logout)    │
└─────────────────────────────────────────────────────────────────┘
```

## Module Map

### Core Modules

| Module                   | Purpose                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `cookie-crypto.ts`       | AES-256-GCM encrypt/decrypt, Brotli compression, cookie chunking (3,800 B/chunk, max 5 chunks)                  |
| `step-mapper.ts`         | Merge HTML FormData into AM callback structures; boolean/numeric coercion for special callback types            |
| `pkce.ts`                | RFC 7636 PKCE — branded `CodeVerifier` and `CodeChallenge` types with S256 transform                            |
| `request.ts`             | Request body reading (1 MB limit), Authorization header extraction                                              |
| `error-response.ts`      | Map typed Effect errors → HTTP responses and user-facing messages                                               |
| `errors.ts`              | `Data.TaggedError` definitions for all BFF failure modes                                                        |
| `am-response-schemas.ts` | Effect `Schema` validators for AM callback, step, and auth-complete responses                                   |
| `logger.ts`              | Configurable Effect log layers — `json`, `pretty`, or `logfmt` format; optional OpenTelemetry export            |
| `authorize.ts`           | OAuth authorize query building, PKCE challenge computation, redirect origin validation                          |
| `locale.ts`              | Resolve locale content from `Accept-Language` header with US English fallback                                   |
| `run.ts`                 | `ManagedRuntime` initialization, `handleRoute` / `handleFormAction` wrappers, request-scoped logging            |
| `route-test-helpers.ts`  | Shared mock factories for route tests — canonical test values, mock SvelteKit primitives, mutable proxy pattern |

### Services

| Module                        | Service Tag            | Purpose                                                                                                                 |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `services/app-config.ts`      | `AppConfigService`     | Reads env vars into a typed `AppConfig` via Effect `Config`                                                             |
| `services/oidc-discovery.ts`  | `OidcDiscoveryService` | Background fiber fetches `/.well-known/openid-configuration` with exponential backoff; resolves a `Deferred` once ready |
| `services/am-proxy.ts`        | `AmProxyService`       | Interface for all AM HTTP calls (authenticate, authorize, tokens, userinfo, revoke, endSession, logout)                 |
| `services/am-proxy.live.ts`   | —                      | Live `AmProxyService` implementation with 3× exponential-backoff retry + configurable timeout                           |
| `services/shutdown-signal.ts` | `ShutdownSignal`       | Listens for SIGTERM/SIGINT, exposes shutdown state; 5s disposal timeout with signal re-delivery                         |

### Routes

| Route              | Method | Purpose                                                                       |
| ------------------ | ------ | ----------------------------------------------------------------------------- |
| `/api/authorize`   | GET    | Build PKCE challenge, proxy to AM's authorize endpoint, validate redirect URL |
| `/api/tokens`      | POST   | Proxy token exchange (code → access_token) to AM                              |
| `/api/userinfo`    | GET    | Proxy userinfo request (Bearer token) to AM                                   |
| `/api/revoke`      | POST   | Proxy token revocation to AM                                                  |
| `/api/end-session` | GET    | Proxy RP-initiated logout to AM                                               |
| `/api/sessions`    | POST   | Unseal `__session`, call AM logout, clear all cookies                         |
| `/api/locale`      | GET    | Serve i18n translation strings by `Accept-Language` header                    |
| `/api/health`      | GET    | Kubernetes readiness probe — 200 when OIDC discovery complete, 503 otherwise  |

## Request Lifecycle

A typical multi-step authentication flow:

```
1. User visits /                       +page.server.ts load()
   └─ No __step cookie                 → returns { step: null }
   └─ Page auto-submits "init" action  (or user clicks "Start" if no JS)

2. Form action: init                   +page.server.ts actions.init()
   └─ POST empty body to AM            /json/realms/.../authenticate
   └─ AM returns { authId, callbacks } (first step)
   └─ Seal authId → __aid cookie(s)    (chunked if >3,800 B)
   └─ Seal callbacks → __step cookie(s)(Brotli-compressed + encrypted)
   └─ Return step data to page

3. Page renders callback inputs        +page.svelte
   └─ Each callback.input[].name       → <input name="IDToken{n}">
   └─ User fills in username/password
   └─ Submits form → "step" action

4. Form action: step                   +page.server.ts actions.step()
   └─ Unseal __aid + __step cookies
   └─ mergeFormDataIntoStep()          Match IDToken{n} → callback inputs
   └─ buildAmRequestBody()             { authId, callbacks: [...] }
   └─ POST to AM /authenticate
   └─ Repeat from step 2 (or finish)

5. Auth complete                       AM returns { tokenId } (no authId)
   └─ Clear __aid + __step cookies
   └─ Generate PKCE code_verifier
   └─ Seal { amCookie, codeVerifier } → __session cookie
   └─ Return { authComplete: true }

6. OAuth flow                          Client-side redirect to /api/authorize
   └─ GET /api/authorize               → proxy to AM with PKCE challenge
   └─ AM redirects with ?code=...      → BFF validates redirect, clears cookies
   └─ Customer's backend exchanges code + code_verifier at /api/tokens
```

## Cookie Architecture

All cookies are encrypted with AES-256-GCM. Large values are chunked across multiple cookies.

| Cookie Prefix | Contents                                     | Compressed                         | Chunked              | Cleared On                |
| ------------- | -------------------------------------------- | ---------------------------------- | -------------------- | ------------------------- |
| `__aid`       | AM `authId` JWT                              | No (base64url resists compression) | Yes (up to 5 chunks) | Auth complete or error    |
| `__step`      | Callback data (type, inputs, outputs, stage) | Yes (Brotli)                       | Yes (up to 5 chunks) | Auth complete or error    |
| `__session`   | AM session cookie + PKCE `codeVerifier`      | No                                 | No (single cookie)   | After authorize or logout |
| `__oauth`     | OAuth authorize query params (pre-login)     | No                                 | No (single cookie)   | After authorize redirect  |

### Encryption Details

- **Algorithm**: AES-256-GCM
- **Key derivation**: SHA-256 hash of `COOKIE_SECRET` → 32-byte key
- **IV**: 12 random bytes (fresh per encryption)
- **Wire format**: `base64url(IV ‖ ciphertext ‖ authTag)`
- **Cookie attributes**: `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=<TTL>`, `Secure` (HTTPS only), optional `Domain`

### Chunking

Cookies exceeding 3,800 bytes are split across numbered chunks: `__aid`, `__aid.0`, `__aid.1`, etc. (max 5 chunks per prefix). Reassembly concatenates chunks in order before decryption.

## Services

The BFF uses four Effect services composed via Layers:

```
                    ┌──────────────────┐
                    │  AppConfigService │◄── env vars (VITE_FR_AM_URL, etc.)
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────┐
│ OidcDiscovery    │ │ AmProxy     │ │ ShutdownSignal │
│ (background fiber│ │ (proxies to │ │ (SIGTERM/    │
│  fetches .well-  │ │  AM with    │ │  SIGINT)     │
│  known/oidc-cfg; │ │  retry;     │ │              │
│  Deferred-based) │ │  lazy OIDC) │ │              │
└──────────────────┘ └─────────────┘ └──────────────┘
```

**Layer composition** (in `hooks.server.ts`):

```typescript
// FetchHttpClient configured with redirect: 'manual' so the BFF
// proxies redirect responses instead of following them (OAuth authorize).
HttpClientLive = FetchHttpClient.layer + { redirect: 'manual' };
BaseLayer = AppConfigService.Default + HttpClientLive;
WithDiscovery = OidcDiscoveryService.Default + BaseLayer;
AppLayerLive = AmProxyLive + WithDiscovery;
// + ShutdownSignal + LoggerLive + OtelLive at runtime init
```

### AmProxyService

The central HTTP client for AM communication. The live implementation (`am-proxy.live.ts`) adds:

- **Retry**: 3 attempts with exponential backoff (~100ms, ~200ms, jittered) on transient failures
- **Timeout**: Configurable via `AM_REQUEST_TIMEOUT` (default 30,000ms)
- **Redirect handling**: `redirect: 'manual'` for OAuth authorize flow

## Error Handling

All errors are `Data.TaggedError` instances with structured fields:

| Error                    | HTTP Status | Meaning                                              |
| ------------------------ | ----------- | ---------------------------------------------------- |
| `AmUnreachable`          | 502         | Network failure reaching AM                          |
| `AmError`                | passthrough | AM returned non-2xx (status forwarded)               |
| `BffValidationError`     | configured  | BFF-side validation failure (e.g., bad redirect URL) |
| `RequestBodyError`       | 400         | Failed to read or oversized request body             |
| `CookieDecryptionFailed` | 401         | AES-GCM decryption failed → "Session expired"        |
| `CookieMissing`          | 401         | Required cookie not present → "Session expired"      |
| `StepMappingError`       | 400         | FormData → callback merge failed                     |
| `ServiceUnavailable`     | 503         | OIDC discovery not yet complete — server starting up |

Route handlers use two combinators from `run.ts`:

- **`handleRoute(ctx)`** — wraps API route Effects: annotates logs with `requestId`/`method`/`pathname`, maps errors to HTTP responses, catches defects as 500
- **`handleFormAction(ctx)`** — wraps form action Effects: same logging, but maps errors to user-facing message strings for the page

## Environment Variables

**Required** (app will not start without these):

| Variable                      | Description                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `VITE_FR_AM_URL`              | ForgeRock AM base URL (e.g., `https://tenant.forgeblocks.com/am`)   |
| `VITE_FR_AM_COOKIE_NAME`      | AM session cookie name (e.g., `iPlanetDirectoryPro`)                |
| `VITE_FR_REALM_PATH`          | AM realm path (e.g., `alpha`)                                       |
| `VITE_FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 client ID                                                 |
| `COOKIE_SECRET`               | AES-256-GCM key (min 32 chars; generate: `openssl rand -base64 32`) |
| `ORIGIN`                      | Full origin URL for CSRF validation (e.g., `http://localhost:3000`) |

**Optional**:

| Variable                      | Default     | Description                                             |
| ----------------------------- | ----------- | ------------------------------------------------------- |
| `COOKIE_TTL_SECONDS`          | `300`       | Cookie `Max-Age` in seconds                             |
| `APP_DOMAIN`                  | `localhost` | Cookie `Domain` attribute                               |
| `AM_REQUEST_TIMEOUT`          | `30000`     | AM HTTP request timeout (ms)                            |
| `LOG_FORMAT`                  | `pretty`    | Log output: `json`, `pretty`, or `logfmt`               |
| `LOG_LEVEL`                   | `Info`      | Log level: `Debug`, `Info`, `Warning`, `Error`, `Fatal` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | —           | OTLP collector URL (unset = OTel disabled)              |
| `OTEL_SERVICE_NAME`           | `login-bff` | OpenTelemetry service name                              |

## Running & Testing

```bash
# Development
cp apps/login-app/.env.example apps/login-app/.env  # fill in values
pnpm dev                                             # start SvelteKit dev server

# Run all BFF unit tests (watch mode)
pnpm --filter login-app test

# Run tests once (CI mode)
pnpm --filter login-app test:run

# Run a specific test file
pnpm --filter login-app exec vitest run 'cookie-crypto'

# Run pipeline benchmarks (measures per-request CPU overhead)
pnpm --filter login-app exec vitest bench

# Docker (production preview + Jaeger tracing)
docker compose up --build                            # http://localhost:3000
# Jaeger UI: http://localhost:16686
```

### Test Coverage

| Test File                                | Covers                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `cookie-crypto.test.ts`                  | Seal/unseal for all cookie types, chunking, decryption failures, real AM fixtures       |
| `pkce.test.ts`                           | Code verifier generation, S256 challenge computation                                    |
| `request.test.ts`                        | Body size limits (1 MB), stream reading, Authorization header extraction                |
| `am-response-schemas.test.ts`            | Schema validation for AM callbacks, steps, auth-complete                                |
| `error-response.test.ts`                 | Error → HTTP status mapping, error message extraction, structured logging               |
| `step-mapper.test.ts`                    | FormData → callback merging, boolean/numeric coercion, hidden callbacks                 |
| `authorize.test.ts`                      | Authorize query building, redirect origin validation                                    |
| `services/app-config.test.ts`            | Config resolution, env var validation, secret length checks                             |
| `services/oidc-discovery.test.ts`        | Background discovery lifecycle, deferred resolution, retry on failure, readiness checks |
| `logger.test.ts`                         | Logger format selection, log level filtering, OTel layer setup                          |
| `page-server.test.ts`                    | Load function, init/step form actions, AM response processing                           |
| `page-actions.test.ts`                   | Additional form action edge cases                                                       |
| `routes-authorize.test.ts`               | `/api/authorize` route handler — PKCE, OAuth cookie, redirect validation                |
| `routes-tokens.test.ts`                  | `/api/tokens` route handler — token exchange proxying                                   |
| `routes-userinfo.test.ts`                | `/api/userinfo` route handler — Bearer token proxying                                   |
| `routes-revoke.test.ts`                  | `/api/revoke` route handler — token revocation proxying                                 |
| `routes-end-session.test.ts`             | `/api/end-session` route handler — RP-initiated logout proxying                         |
| `routes-sessions.test.ts`                | `/api/sessions` route handler — session teardown, AM logout, cookie clearing            |
| `routes-locale.test.ts`                  | `/api/locale` route handler — i18n content by Accept-Language                           |
| `routes-health.test.ts`                  | `/api/health` route handler — readiness probe, OIDC discovery state                     |
| `integration/routes.integration.test.ts` | Tier 2: Real SvelteKit server + MSW — Content-Type, security headers, CSRF, JSON errors |
| `integration/login-flow.e2e.test.ts`     | Tier 3: Real Chromium browser + stateful mock AM — onMount auto-submit, noscript POSTs  |
| `pipeline.bench.ts`                      | Vitest benchmarks for per-request CPU overhead (seal/unseal, compress, merge)           |

## Adding a Route

1. **Create the route file**

   ```
   apps/login-app/src/routes/api/<name>/+server.ts
   ```

2. **Define the handler as an Effect pipeline**

   ```typescript
   import { Effect } from 'effect';
   import type { RequestEvent } from '@sveltejs/kit';
   import { handleRoute, run } from '$server/run';
   import { AmProxyService } from '$server/services/am-proxy';

   export async function GET(event: RequestEvent) {
     return AmProxyService.pipe(
       Effect.flatMap((proxy) =>
         // ... build request, call AM, return Response
         proxy.userinfo({ authorization: '...' }),
       ),
       Effect.map((amResponse) => new Response(amResponse.body)),
       handleRoute(event),
       run,
     );
   }
   ```

3. **Use existing combinators** from `error-response.ts` for consistent error handling:

   - `amResponseToHttp()` — passthrough AM responses
   - `errorToResponse()` — map typed errors to HTTP responses

4. **Add tests** in a sibling `.test.ts` file or in `apps/login-app/src/lib/server/`

5. **Update this README** — add the route to the Routes table above
