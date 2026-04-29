# Cloudflare Workers deployment (PREVIEW)

Deploys the Ping Identity Login App to Cloudflare Workers using
[Alchemy](https://alchemy.run) (`2.0.0-beta.x`).

## Status: skeleton

This template **deploys**, but sessions do **not** function. The login app
currently holds session state in an in-process `Map`, which is incompatible
with V8 isolates. The `Sessions` KV namespace declared in `alchemy.run.ts`
is provisioned and bound into the Worker, ready for the future
`kvSessionStore` implementation.

Use this template today to:

- Verify that a Worker bundle of the login app builds successfully.
- Smoke-test deploy/destroy cycles against your Cloudflare account.
- Stake out the deployment shape for review before the session work lands.

Do **not** point real user traffic at this template until the session
refactor is complete.

## Prerequisites

- A Cloudflare account with Workers enabled.
- A Cloudflare API token with `Workers Scripts:Edit` and `Workers KV
Storage:Edit` permissions for your account.
- Node 20+ and pnpm (matching the repo `engines` block).
- An AM tenant with a configured public OAuth 2.0 client.

## Setup

```sh
cd deploy-templates/cloudflare
cp .env.example .env
# edit .env with your CF account/token and AM tenant details
pnpm install
pnpm run deploy
```

`alchemy deploy` (the `deploy` script) will:

1. Build `apps/login-app` for the Cloudflare runtime via Vite.
2. Provision a KV namespace named `Sessions`.
3. Upload the Worker with the KV namespace bound as `env.Sessions`.
4. Print the Worker's `*.workers.dev` URL.

To tear down: `pnpm run destroy`.

## Adapter

This template assumes `apps/login-app/svelte.config.js` selects
`@sveltejs/adapter-cloudflare` when `DEPLOY_TARGET=cloudflare` is set. As
of writing, the app uses `adapter-auto` / `adapter-node` only — flipping
to `adapter-cloudflare` in addition is part of the work this template
brackets. For the skeleton verification, Vite + Alchemy's Cloudflare
plugin handles the bundling regardless.

## Limitations and caveats

| Concern                | Status                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session storage        | Broken — in-process Map. KV impl pending.                                                                                                                                                         |
| `nodejs_compat` flag   | Enabled (`compatibility.flags`). Some Node APIs may still fail at runtime; verify against your specific journey shapes.                                                                           |
| Cookie size limit      | Cloudflare's per-cookie limit is 4 KB; `authId` JWTs from AM may approach this on complex journeys. Once session work lands, this is moot (cookie holds a UUID).                                  |
| AM tenant reachability | The Worker must be able to reach your AM URL. If your AM is on a private network, deploy to a Worker that can route through Cloudflare Tunnel or use Workers for Platforms with a private origin. |

## Required environment variables

### Deploy-time (read by Alchemy)

| Variable                | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Account where the Worker + KV namespace are created. |
| `CLOUDFLARE_API_TOKEN`  | Token with Workers + KV write permissions.           |

### Runtime (set as Worker secrets)

| Variable                 | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `FR_AM_URL`              | Your AM base URL.                               |
| `FR_AM_COOKIE_NAME`      | The AM session cookie name.                     |
| `FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 public client ID.                     |
| `FR_REALM_PATH`          | Realm the login app authenticates against.      |
| `COOKIE_SECRET`          | HMAC key for the browser-facing session cookie. |

Set runtime secrets via:

```sh
pnpm exec alchemy secrets set FR_AM_URL "<value>"
# or via wrangler if you prefer:
# pnpm exec wrangler secret put FR_AM_URL --name LoginApp
```

## When session work lands

Once the login app's `SessionStore` interface is published and a `kvSessionStore`
is shipped, this template will gain a small `hooks.server.ts` overlay that
calls `setSessionStore(kvSessionStore(env.Sessions))` on Worker startup.
At that point, this template moves from "skeleton" to "production-ready"
without further infra changes.
