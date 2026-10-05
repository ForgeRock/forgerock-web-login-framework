---
'@forgerock/login-widget': minor
'@forgerock/login-framework-cli': minor
---

Add support for `header` and `footer` custom components. In `@forgerock/login-widget`, the registry accepts the two new component types, and header/footer components are opt-in via an `Enabled:` property in the `@component` comment block: a component with `Enabled: true` is bundled with the login app and rendered above/below the journey, at most one header and one footer may declare it (a second enabled component of the same type fails the registry build), and dormant components (no `Enabled` line, or `Enabled: false`) are skipped entirely. In `@forgerock/login-framework-cli`, add `generate header <Name>` and `generate footer <Name>` commands, the matching `ping-lf` MCP server tools, and the header/footer component templates they scaffold. The CLI no longer generates `custom-registry.ts` from `generate`, `init`, or `update` (or their MCP tool equivalents): the framework's Vite plugin is the single registry generator, regenerating on the first build or dev-server start and watching `experimental/custom/` in dev, so the duplicate registry implementation in the CLI is removed.
