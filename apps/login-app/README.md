# Login App

A [SvelteKit](https://kit.svelte.dev/) application that serves two independent authentication modes:

1. **BFF (Backend-for-Frontend)** — server-side authentication via [Effect-TS](https://effect.website) form actions that proxy to ForgeRock AM. All session state lives in AES-256-GCM encrypted cookies — no server-side session store — so the BFF scales horizontally with zero shared state. Works with and without JavaScript (progressive enhancement).

2. **Widget host** — serves the client-side `@forgerock/login-widget` for development, documentation, and E2E testing. The widget talks directly to AM from the browser.

## Architecture

```
/(app)/*   → BFF mode     Server-side form actions → AmProxyLive → AM
                          Encrypted cookie session, progressive enhancement
                          Full CSP + security headers

/e2e/*     → Widget mode  Client-side JS SDK → AM (cross-origin)
                          No server-side auth, CSP stripped

/docs/*    → Documentation  Rendered markdown pages via mdsvex
```

The two modes share the same SvelteKit app but are completely independent — different routes, different auth mechanisms, different security policies. See [`src/lib/server/README.md`](src/lib/server/README.md) for detailed BFF architecture, cookie design, and service layer documentation.

## Running the App

### From the Repository Root (Recommended)

```shell
# Builds the widget first, then starts the dev server
pnpm dev
```

### Directly

```shell
# Build the widget first
pnpm build:widget

# Then start the dev server
pnpm --filter @forgerock/login-app run dev
```

The app runs at `http://localhost:5173` by default (Vite's default port).

## Building

```shell
# Build both the widget and app
pnpm build:app

# Or build just the app (widget must already be built)
pnpm --filter @forgerock/login-app run build

# Production build with adapter-node (generates build/index.js)
PREVIEW=true pnpm --filter @forgerock/login-app run build

# Preview the production build
pnpm --filter @forgerock/login-app run preview
```

> **Note:** `PREVIEW=true` switches from `adapter-auto` to `adapter-node`, producing `build/index.js`. This is required for production deployments and BFF E2E tests.

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```shell
cp apps/login-app/.env.example apps/login-app/.env
```

### Required

| Variable                      | Description                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `VITE_FR_AM_URL`              | ForgeRock AM base URL (e.g., `https://tenant.forgeblocks.com/am`)   |
| `VITE_FR_AM_COOKIE_NAME`      | AM session cookie name (e.g., `iPlanetDirectoryPro`)                |
| `VITE_FR_REALM_PATH`          | AM realm path (e.g., `alpha`)                                       |
| `VITE_FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 client ID                                                 |
| `COOKIE_SECRET`               | AES-256-GCM key (min 32 chars; generate: `openssl rand -base64 32`) |
| `ORIGIN`                      | Full origin URL for CSRF validation (e.g., `http://localhost:3000`) |

### Optional

| Variable                      | Default     | Description                                             |
| ----------------------------- | ----------- | ------------------------------------------------------- |
| `COOKIE_TTL_SECONDS`          | `300`       | Cookie `Max-Age` in seconds                             |
| `APP_DOMAIN`                  | `localhost` | Cookie `Domain` attribute                               |
| `AM_REQUEST_TIMEOUT`          | `30000`     | AM HTTP request timeout (ms)                            |
| `LOG_FORMAT`                  | `pretty`    | Log output: `json`, `pretty`, or `logfmt`               |
| `LOG_LEVEL`                   | `Info`      | Log level: `Debug`, `Info`, `Warning`, `Error`, `Fatal` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | —           | OTLP collector URL (unset = OTel disabled)              |
| `OTEL_SERVICE_NAME`           | `login-bff` | OpenTelemetry service name                              |

## Testing

### Unit & Integration Tests

```shell
# Watch mode
pnpm --filter @forgerock/login-app test

# CI mode (run once)
pnpm --filter @forgerock/login-app test:run

# Single file
pnpm --filter @forgerock/login-app exec vitest run 'cookie-crypto'

# Integration tests (real SvelteKit server + MSW)
pnpm --filter @forgerock/login-app test:integration

# Pipeline benchmarks
pnpm --filter @forgerock/login-app exec vitest bench
```

### BFF E2E Tests

Self-contained tests that spawn a mock AM server and SvelteKit subprocess — no external AM needed.

```shell
# Prerequisites
PREVIEW=true pnpm --filter @forgerock/login-app run build
pnpm --filter @forgerock/login-app exec playwright install chromium

# Run all BFF E2E tests
pnpm --filter @forgerock/login-app test:e2e:bff

# Run specific projects (JS enabled / disabled)
pnpm --filter @forgerock/login-app exec playwright test \
  --config playwright.bff.config.ts \
  --project chromium-js --project chromium-nojs
```

### Widget E2E Tests

Run from the `e2e/` workspace against a real AM instance. See the [root CLAUDE.md](../../CLAUDE.md) for setup.

```shell
pnpm ci:e2e
```

## Security

### CSP (Content Security Policy)

CSP is configured in `svelte.config.js` with SvelteKit's built-in nonce generation for inline hydration scripts. Per-route overrides are applied in `hooks.server.ts`:

| Route       | CSP Behavior                                                             |
| ----------- | ------------------------------------------------------------------------ |
| `/(app)/*`  | Full restrictive CSP (`default-src 'self'`, `frame-ancestors 'none'`)    |
| `/callback` | `frame-ancestors` relaxed to `'self'` (SDK uses hidden iframe for OAuth) |
| `/e2e/*`    | CSP header removed (widget makes direct cross-origin AM requests)        |

### Security Headers

Applied to all non-E2E routes via `hooks.server.ts`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (overridden to `SAMEORIGIN` on `/callback`)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Type Checking

```shell
pnpm check:svelte
```

---

&copy; Copyright 2022-2026 Ping Identity Corporation. All Rights Reserved.
