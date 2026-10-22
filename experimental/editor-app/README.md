# Editor App

The Custom Components UI — Journey Components list, create view, and component
editor — as a standalone SvelteKit SPA (IAM-12074). In production this app is
served inside the AIC admin console; in development login-app's dev proxy
serves it at login-app's admin-facing URLs so the whole integration is
same-origin.

Deliberately not a pnpm workspace package: it runs with its own dependencies
(`pnpm install` inside this directory), like `experimental/editor-poc`,
keeping it out of the monorepo's install graph.

## Running

Two servers, two terminals (no orchestrator):

```shell
# Terminal 1 — login-app on :8443 (builds the widget first)
pnpm dev

# Terminal 2 — this app on :5174
cd experimental/editor-app
pnpm install
pnpm run dev
```

## Architecture

- **All Custom Components UI lives here** — never re-implemented in login-app.
- **URL contract** (reserved namespace, login-app defines no routes under it):
  - `/custom-components/?tab=<stage|callback|layout>` — Journey Components list
    (create is a modal on this page, mirroring the design — it funnels into the
    editor route on success)
  - `/custom-components/<type>/<id>` — editor view
- login-app's dev server proxies `/custom-components*` to this app (see
  `apps/login-app/vite.config.ts`, target from `EDITOR_APP_URL`, default
  `http://localhost:5174`). `paths.base` in `svelte.config.js` matches, so
  asset URLs loop back through the proxy. SvelteKit itself 308-redirects the
  bare (unslashed) URL to the canonical slashed list URL — with `paths.base`
  set, the framework treats the base root as always-slashed.
- This app calls the Component API directly from the browser
  (`/api/components/*`, served by login-app's SvelteKit routes when
  `COMPONENT_API_ENABLED=true`). Same-origin in dev means the admin's AM
  session cookie rides along with no extra configuration.
- `src/lib/api.ts` is the only file that talks to the API: DOM-free,
  returns `ApiResult<T>` values instead of throwing.

## Scope

Create, list, edit (with dirty-tracking Reset), publish (one global command),
delete. The real production editor (LiveCodes, preview, sandboxing) is a
separate effort (SDKS-5259).
