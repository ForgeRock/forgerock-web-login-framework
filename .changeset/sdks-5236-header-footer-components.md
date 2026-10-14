---
'@forgerock/login-widget': minor
'@forgerock/login-framework-cli': minor
---

Add custom page header and footer wrappers to the login app. The app renders two fixed, user-editable files (`experimental/custom/header/header.svelte` and `experimental/custom/footer/footer.svelte`) around the journey container, placed by `ping-lf init` and preserved by `ping-lf update`. Each wrapper mounts client-side only (after the first journey step, latched for the session) and receives a single `journeyName` prop — the journey currently driving the page, where `''` means the AM default journey — so wrappers can render per-journey views. In `@forgerock/login-framework-cli`, the `generate header`/`generate footer` commands and their MCP tools are removed (headers/footers are wrapper files you edit directly, not scaffolded components), and `init` backfills the wrapper files so projects updated from older framework versions can build. The header/footer registry types are removed in favor of the wrappers; the CLI no longer generates `custom-registry.ts` from `generate`, `init`, or `update` (or their MCP tool equivalents): the framework's Vite plugin is the single registry generator.
