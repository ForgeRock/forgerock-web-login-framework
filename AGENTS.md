# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, GitHub
Copilot, Gemini, etc.) when working with code in this repository. It follows the
open AGENTS.md convention.

> **Note:** `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` in
> this repository are redirects to AGENTS.md — each uses its tool's native include
> syntax (`@AGENTS.md` for Claude Code, `@./AGENTS.md` for Gemini CLI, a prose
> link for Copilot which has no file-include syntax). Edit AGENTS.md only.

## Project Overview

`@forgerock/login-framework` is the ForgeRock / Ping Identity **web login
widget** — an embeddable, framework-agnostic UI that drives AM (Access
Management) authentication journeys. The published artifact is
`@forgerock/login-widget`: a Svelte-built widget consumable as an ES module, as
a standalone IIFE script-tag bundle, or via typed bindings.

## Monorepo Layout

A **pnpm** monorepo (`pnpm@10.6.0`). Workspaces: `packages/*`, `apps/*`, `e2e`,
`themes`, `tools/*`.

- `packages/login-widget` — `@forgerock/login-widget`, the published npm package
- `apps/login-app` — SvelteKit dev/docs host app
- `e2e` — Playwright E2E test workspace
- `core/` — shared stores, components, journey logic, locales (**not** a
  workspace)

### The `core/` Directory

`core/` is intentionally **not** a workspace — it has no `package.json` and no
build step of its own. It is imported via path aliases and compiled as part of
each consumer's build.

**Path aliases** (defined in `core/tsconfig.json`, mirrored in each consumer's
Vite config):

| Alias         | Resolves To        |
| ------------- | ------------------ |
| `$core`       | `core/`            |
| `$components` | `core/components/` |
| `$journey`    | `core/journey/`    |
| `$locales`    | `core/locales/`    |

**Dependency hoisting:** `core/`'s runtime deps (e.g.
`@forgerock/javascript-sdk`, `xss`, `zod`, `qrcode`) are declared in
`packages/login-widget/package.json` and hoisted to root `node_modules` via
`public-hoist-pattern` rules in `.npmrc`. **When adding a new dependency that
`core/` imports, add it to `packages/login-widget/package.json` and, if needed,
add a `public-hoist-pattern` entry in `.npmrc`.**

### Public API

`widgetApiFactory` (`packages/login-widget/src/lib/widget.api.ts`) wraps the
`core/` stores into the exported public functions: `configuration`, `journey`,
`user`, `request`, `component`, and `protect`. `index.svelte` re-exports these
from its module context.

## Widget Build

- **Entry point:** `packages/login-widget/src/lib/index.svelte` — the
  `<script context="module">` block exports the public API.
- **ES module build:** `vite.config.ts` → `dist/index.js` + `dist/widget.css`.
- **IIFE build:** `vite.config.iife.ts` → `dist/widget.iife.js` (standalone
  script-tag bundle).
- **Type declarations:** `svelte-package` generates types, then
  `scripts/copyTypes.mjs` and `scripts/processTypes.mjs` post-process them into
  `dist/`.
- **Svelte compat mode:** `componentApi: 4` preserves the
  `new Widget({ target })` instantiation pattern for consumers.
- **Externalized runtime deps** (ES build): `@forgerock/javascript-sdk`,
  `@forgerock/ping-protect`, `qrcode`, `xss`, `zod`.

## Commands

Run from the repository root.

| Command               | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `pnpm dev`            | Build widget, then start the SvelteKit dev app               |
| `pnpm build:widget`   | Build the widget package only                                |
| `pnpm build:app`      | Build widget + SvelteKit app                                 |
| `pnpm build:release`  | Full release build (widget + IIFE + types)                   |
| `pnpm test`           | Run Vitest unit tests (watch mode)                           |
| `pnpm test -- --run`  | Run unit tests once (CI mode)                                |
| `pnpm storybook`      | Launch Storybook on port 6006                                |
| `pnpm test:storybook` | Run Storybook interaction tests (requires running Storybook) |
| `pnpm check:lint`     | Prettier + ESLint check                                      |
| `pnpm check:svelte`   | Run svelte-check on the login-app                            |
| `pnpm format`         | Auto-format with Prettier                                    |
| `pnpm ci:e2e`         | Run Playwright E2E tests                                     |
| `pnpm changeset`      | Create a changeset for release management                    |

### Running a Single Test

```sh
# Unit test — filter is a regex matched against file paths.
# IMPORTANT: `pnpm test --` does NOT pass the filter correctly.
# Use `pnpm exec` in the widget workspace instead:
pnpm --filter @forgerock/login-widget exec vitest run 'i18n'

# E2E test (Playwright — file path relative to e2e/)
pnpm ci:e2e -- tests/widget/modal/widget-modal.login.test.js
```

### E2E Prerequisites

```sh
pnpm build:app
pnpm --filter @forgerock/login-widget-e2e exec playwright install chromium
```

E2E tests and the login-app require AM connection details via `.env` or shell:

- `FR_AM_URL` — ForgeRock AM base URL
- `FR_AM_COOKIE_NAME` — AM session cookie name
- `FR_OAUTH_PUBLIC_CLIENT` — OAuth 2.0 client ID
- `FR_REALM_PATH` — AM realm path

## Tests and Stories

- **Unit tests** live alongside source in `core/` (e.g.
  `core/_utilities/i18n.utilities.test.ts`). Vitest config is at
  `packages/login-widget/vitest.config.ts` — it sets `test.dir` to `../../core`
  and resolves the same path aliases.
- **Storybook stories** also live alongside source in `core/` as `*.stories.js`
  files with companion `*.story.svelte` components.

## Tech Stack

- **Svelte** (`componentApi: 4` compat mode) + **Tailwind CSS** (compiled away
  at build time).
- **Vite** for builds, **Vitest** for unit tests, **Playwright** for E2E.
- **Storybook** with Svelte integration, **Chromatic** for visual regression.
- **Changesets** for versioning/release management.
- **Husky + lint-staged** pre-commit hooks (Prettier + ESLint on staged files).

## Conventions

- **Commit style:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`,
  etc.). Use `pnpm commit` for the interactive prompt.
- **Changesets:** Every PR that changes published package behavior must include a
  changeset (`pnpm changeset`). Not needed for docs, dev-app, E2E, or CI-only
  changes.
- **Pre-commit hooks:** Husky + lint-staged runs Prettier and ESLint on staged
  `.js`, `.svelte`, `.ts` files automatically.
- **Single-test filter caveat:** do not rely on `pnpm test -- <pattern>`; run
  Vitest in the widget workspace (`pnpm --filter ... exec vitest run ...`).

## Architecture Overview

State and logic live in `core/` as **singleton Svelte stores** — there is no
Redux/RTK and no network-client layer here (network calls are delegated to the
externalized `@forgerock/javascript-sdk`). The widget composes UI on top of
those stores, and `packages/login-widget` packages the result for publishing.

Dependencies flow in one direction — UI and the published package depend on
`core/`, never the reverse:

```
packages/login-widget  ──►  core/  ──►  @forgerock/javascript-sdk
apps/login-app         ──►  core/        (externalized runtime dep)
```

**Store layer** (`core/`): one singleton store per concern. `style.store.ts`,
`locale.store.ts`, `links.store.ts`, `component.store.ts`,
`oauth/oauth.store.ts`, `user/user.store.ts`, `journey/journey.store.ts`,
`journey/config.store.ts`. Stores own state; everything else derives from them.

**Journey layer** (`core/journey/`): the authentication flow. Strict internal
hierarchy — `_utilities/` (lowest) → `stages/` and `callbacks/`. **Callbacks
must never import from `stages/`.** Shared logic belongs in
`core/journey/_utilities/`. There is one directory per AM callback type under
`callbacks/` (22 of them: `password`, `kba`, `choice`, `device-profile`,
`ping-protect-evaluation`, `recaptcha-enterprise`, `select-idp`, …).

**Component layer** (`core/components/`): `primitives/` (atomic elements —
`button`, `input`, `label`, `spinner`, …) and `compositions/` (compound
patterns — `dialog`, `checkbox`, `input-floating`, `select-stacked`, …).
Compositions build on primitives.

**Package layer** (`packages/login-widget`): the published artifact. `widget.api.ts`
exposes `widgetApiFactory`; `index.svelte` re-exports the public API. Builds the
ES, IIFE, and type-declaration outputs (see [Widget Build](#widget-build)).

## Project Structure

```
core/                          # Shared logic — NOT a workspace, compiled per consumer
├── *.store.ts                 # Singleton Svelte stores (style, locale, links, component)
├── *.config.ts                # Config parsers (sdk.config.ts, captcha.config.ts)
├── interfaces.ts              # Shared type contracts
├── _utilities/                # Pure cross-cutting helpers (i18n, errors, theme)
├── _effects/                  # Cross-cutting side-effects (theme.effects.ts)
├── components/
│   ├── primitives/            # Atomic UI elements
│   ├── compositions/          # Compound UI patterns (dialog, input-floating, …)
│   ├── icons/
│   └── _utilities/
├── journey/                   # Authentication flow
│   ├── journey.store.ts       # Flow state + orchestration
│   ├── config.store.ts
│   ├── journey.svelte         # Flow component
│   ├── journey.interfaces.ts
│   ├── _utilities/            # Shared journey helpers (lowest layer)
│   ├── stages/                # Step groupings (login, otp, qr-code, …)
│   │   ├── _utilities/
│   │   └── _effects/
│   └── callbacks/             # One directory per AM callback type (22)
│       ├── _utilities/
│       └── _effects/
├── oauth/oauth.store.ts
├── user/user.store.ts
├── server/                    # Server-side utilities
└── locales/                   # i18n message catalogs

packages/login-widget/         # @forgerock/login-widget — published package
├── src/lib/index.svelte       # Entry point; module context exports the public API
├── src/lib/widget.api.ts      # widgetApiFactory — wraps core stores into the public API
├── vite.config.ts             # ES build → dist/index.js + dist/widget.css
├── vite.config.iife.ts        # IIFE build → dist/widget.iife.js
├── vitest.config.ts           # test.dir = ../../core
└── scripts/                   # copyTypes.mjs, processTypes.mjs (type post-processing)

apps/login-app/                # SvelteKit dev/docs host app
e2e/tests/                     # Playwright suites (widget, login-app, utilities)
```

## Internal File Conventions

Architecture is encoded in file names — a constraint mechanism, not cosmetic.
Tests and stories are colocated with the source they cover.

| File suffix                       | Responsibility                                        |
| --------------------------------- | ----------------------------------------------------- |
| `*.store.ts`                      | Singleton Svelte store — owns a slice of widget state |
| `*.config.ts`                     | Configuration parsing into typed values               |
| `*.effects.ts`                    | Side-effectful logic (theme, webauthn, captcha)       |
| `*.utilities.ts`                  | Pure helpers and transformations — no side-effects    |
| `*.interfaces.ts`                 | Type contracts — no runtime code                      |
| `*.svelte`                        | UI components (stages, callbacks, primitives)         |
| `*.test.ts`                       | Vitest unit tests, colocated with source              |
| `*.stories.js` + `*.story.svelte` | Storybook stories, colocated with source              |

**Key rules:**

- Side-effectful logic belongs in `*.effects.ts` — never in `*.utilities.ts`
  (utilities must be pure and stateless).
- `*.interfaces.ts` files have no runtime code — `type` and `interface` only.
- Stores are singletons; derive computed values from store state rather than
  copying it.
- `core/journey/callbacks/` must never import from `core/journey/stages/` —
  shared logic lives in `core/journey/_utilities/`.
