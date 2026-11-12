# @forgerock/login-framework-cli

## 0.2.0

### Minor Changes

- [#602](https://github.com/ForgeRock/forgerock-web-login-framework/pull/602) [`92c979f`](https://github.com/ForgeRock/forgerock-web-login-framework/commit/92c979f9ad69b1b4b391c69d36b3440a682107a7) Thanks [@SteinGabriel](https://github.com/SteinGabriel)! - Add custom page header and footer wrappers to the login app. The app renders two fixed, user-editable files (`experimental/custom/header/header.svelte` and `experimental/custom/footer/footer.svelte`) around the journey container. Each wrapper mounts client-side only (after the first journey step, latched for the session) and receives a single `journeyName` prop — the journey currently driving the page, where `''` means the AM default journey — so wrappers can render per-journey views.

  The wrappers are generated on the first build: the framework's Vite plugin seeds any missing wrapper at build start (and on every dev-server start) and never overwrites one that exists. In `@forgerock/login-framework-cli`, `init` places the wrapper files in new projects and `update` backfills only the ones that are missing, so edits survive framework upgrades; the `generate header`/`generate footer` commands and their MCP tools are removed (headers/footers are wrapper files you edit directly, not scaffolded components). The header/footer registry types are removed in favor of the wrappers; the CLI no longer generates `custom-registry.ts` from `generate`, `init`, or `update` (or their MCP tool equivalents): the framework's Vite plugin is the single registry generator.

### Patch Changes

- [#560](https://github.com/ForgeRock/forgerock-web-login-framework/pull/560) [`75c0a0a`](https://github.com/ForgeRock/forgerock-web-login-framework/commit/75c0a0abeafa37f1126717cd487422a382f0d0d2) Thanks [@SteinGabriel](https://github.com/SteinGabriel)! - Fix `generate stage <Name>` producing incorrect slugs for PascalCase stage names (e.g. `MyCustomStage` → `mycustomstage` instead of `my-custom-stage`). Stage slugs now hyphenate at word and acronym boundaries the same way callback slugs do.

## 0.1.1

### Patch Changes

- [#575](https://github.com/ForgeRock/forgerock-web-login-framework/pull/575) [`50556f5`](https://github.com/ForgeRock/forgerock-web-login-framework/commit/50556f51b4ddd8b9d14b095e1f7735d88b435bd1) Thanks [@vatsalparikh](https://github.com/vatsalparikh)! - Fix CLI generation, registry parsing, and release tag handling.

## 0.1.0

### Minor Changes

- [#464](https://github.com/ForgeRock/forgerock-web-login-framework/pull/464) [`1a8ab4e`](https://github.com/ForgeRock/forgerock-web-login-framework/commit/1a8ab4e763e20c08f77e8ec9b1fa54646a39af6d) Thanks [@SteinGabriel](https://github.com/SteinGabriel)! - Add `ping-lf` CLI tool (`tools/cli/`) for bootstrapping and maintaining Login Framework projects.

  Three commands:

  - `init <directory>` — fetches a GitHub release and scaffolds a new project directory with all necessary configuration, dependencies, and an empty `experimental/custom/` structure ready for `pnpm install`.
  - `generate callback|stage <Name>` — scaffolds a new custom callback or stage component from templates, naming files correctly (PascalCase → kebab-case). The framework's Vite plugin picks up the new component automatically on the next build or dev-server reload.
  - `update [--version <ver>]` — fetches the target framework release and overwrites core files while preserving `experimental/custom/`, and updates `.generator-version`.

  Installable via `npm install -g @forgerock/login-framework-cli`.

- [#500](https://github.com/ForgeRock/forgerock-web-login-framework/pull/500) [`5564d04`](https://github.com/ForgeRock/forgerock-web-login-framework/commit/5564d049ac806f80304dca72be0235deb465e1d4) Thanks [@ryanbas21](https://github.com/ryanbas21)! - Add MCP command to the CLI tool for LLM agent harness integration
