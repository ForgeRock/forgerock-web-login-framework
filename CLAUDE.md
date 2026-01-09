# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

| Command               | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `pnpm dev`            | Build widget then start SvelteKit dev app                    |
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

```shell
# Unit test — filter is a regex matched against file paths.
# IMPORTANT: `pnpm test --` does NOT pass the filter correctly.
# Use `pnpm exec` in the widget workspace instead:
pnpm --filter @forgerock/login-widget exec vitest run 'i18n'

# E2E test (Playwright — file path relative to e2e/)
pnpm ci:e2e -- tests/widget/modal/widget-modal.login.test.js
```

### E2E Prerequisites

Before running E2E tests: `pnpm build:app` then `pnpm --filter @forgerock/login-widget-e2e exec playwright install chromium`.

## Architecture

### Monorepo Layout

```
forgerock-web-login-framework/
├── packages/login-widget/   # @forgerock/login-widget — published to npm
├── apps/login-app/          # SvelteKit dev/docs app
├── core/                    # Shared stores, components, utilities (NOT a workspace)
└── e2e/                     # Playwright E2E tests
```

**pnpm workspaces**: `packages/*`, `apps/*`, `e2e`.

### The `core/` Directory

`core/` is intentionally **not** a workspace — it has no `package.json` and no build step. It is imported via path aliases and compiled as part of each consumer's build.

**Path aliases** (defined in `core/tsconfig.json`, mirrored in each consumer's Vite config):

| Alias         | Resolves To        |
| ------------- | ------------------ |
| `$core`       | `core/`            |
| `$components` | `core/components/` |
| `$journey`    | `core/journey/`    |
| `$locales`    | `core/locales/`    |

**Dependency hoisting**: `core/`'s runtime deps (e.g. `@forgerock/javascript-sdk`, `xss`, `zod`, `qrcode`) are declared in `packages/login-widget/package.json` and hoisted to root `node_modules` via `public-hoist-pattern` rules in `.npmrc`. **When adding a new dependency that `core/` imports, you must add it to `packages/login-widget/package.json` and may need to add a `public-hoist-pattern` entry in `.npmrc`.**

### Widget Build

- **Entry point**: `packages/login-widget/src/lib/index.svelte` — `<script context="module">` exports the public API (`configuration`, `journey`, `user`, `request`, `component`, `protect`)
- **ES module build**: `vite.config.ts` → `dist/index.js` + `dist/widget.css`
- **IIFE build**: `vite.config.iife.ts` → `dist/widget.iife.js` (standalone script-tag bundle)
- **Type declarations**: `svelte-package` generates types, then `scripts/copyTypes.mjs` and `scripts/processTypes.mjs` post-process them into `dist/`
- **Svelte compat mode**: `componentApi: 4` preserves the `new Widget({ target })` instantiation pattern for consumers
- **Runtime deps are externalized** in the ES build: `@forgerock/javascript-sdk`, `@forgerock/ping-protect`, `qrcode`, `xss`, `zod`

### Component Hierarchy

```
Widget (index.svelte)
├── Dialog (compositions/dialog/) — modal wrapper
└── Journey (journey/journey.svelte) — authentication flow
    ├── Stages (journey/stages/) — step groupings
    └── Callbacks (journey/callbacks/) — one directory per AM callback type
```

- **Compositions** (`core/components/compositions/`): compound UI patterns (dialog, checkbox, input, radio, select)
- **Primitives** (`core/components/primitives/`): atomic UI elements

### State Management

Singleton Svelte stores in `core/` manage all widget state. The public API is constructed by `widgetApiFactory` in `packages/login-widget/src/lib/_utilities/api.utilities`, which wraps these stores into the exported `configuration`, `journey`, `user`, `request`, and `protect` functions. Key store areas: styling, i18n/locale, component lifecycle, SDK config, journey flow, OAuth, and user/token state.

### Tests and Stories

- **Unit tests** live alongside source in `core/` (e.g. `core/_utilities/i18n.utilities.test.ts`). Vitest config is at `packages/login-widget/vitest.config.ts` — it sets `test.dir` to `../../core` and resolves the same path aliases.
- **Storybook stories** also live alongside source in `core/` as `*.stories.js` files with companion `*.story.svelte` components.

## Tech Stack

- **Svelte** (with `componentApi: 4` compat mode) + **Tailwind CSS** (compiled away at build time)
- **Vite** for builds, **Vitest** for unit tests, **Playwright** for E2E
- **Storybook** with Svelte integration, **Chromatic** for visual regression
- **Changesets** for versioning/release management
- **Husky + lint-staged** pre-commit hooks (Prettier + ESLint on staged files)

## Environment Variables

The login-app and E2E tests require ForgeRock AM connection details via `.env` or shell:

- `VITE_FR_AM_URL` — ForgeRock AM base URL
- `VITE_FR_AM_COOKIE_NAME` — AM session cookie name
- `VITE_FR_OAUTH_PUBLIC_CLIENT` — OAuth 2.0 client ID
- `VITE_FR_REALM_PATH` — AM realm path

## Conventions

- **Commit style**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.). Use `pnpm commit` for interactive prompt.
- **Changesets**: Every PR that changes published package behavior must include a changeset (`pnpm changeset`). Not needed for docs, dev-app, E2E, or CI changes.
- **Pre-commit hooks**: Husky + lint-staged runs Prettier and ESLint on staged `.js`, `.svelte`, `.ts` files automatically.
