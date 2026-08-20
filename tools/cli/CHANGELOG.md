# @forgerock/login-framework-cli

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
