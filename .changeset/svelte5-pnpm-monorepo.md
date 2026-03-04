---
'@forgerock/login-widget': minor
---

Migrate to Svelte 5, pnpm monorepo architecture, and fix published type declarations

- Upgrade Svelte from v3/v4 to v5 with backward-compatible legacy mode
- Restructure project into pnpm workspaces: `packages/login-widget`, `apps/login-app`, `e2e/`, `core/`
- Fix published type declarations by namespacing core types under `dist/core/` with correct relative paths
- Upgrade Storybook from v7 to v10
- Replace Rollup with Vite for all builds
- Overhaul CI pipeline for pnpm strict dependency isolation
