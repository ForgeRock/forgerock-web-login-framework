---
'@forgerock/login-framework-cli': minor
---

Add `ping-lf` CLI tool (`tools/cli/`) for bootstrapping and maintaining Login Framework projects.

Three commands:

- `init <directory>` — fetches a GitHub release and scaffolds a new project directory with all necessary configuration, dependencies, and an empty `experimental/custom/` structure ready for `pnpm install`.
- `generate callback|stage <Name>` — scaffolds a new custom callback or stage component from templates, naming files correctly (PascalCase → kebab-case). The framework's Vite plugin picks up the new component automatically on the next build or dev-server reload.
- `update [--version <ver>]` — fetches the target framework release and overwrites core files while preserving `experimental/custom/`, and updates `.generator-version`.

Installable via `npm install -g @forgerock/login-framework-cli`.
