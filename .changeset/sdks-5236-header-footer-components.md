---
'@forgerock/login-widget': minor
'@forgerock/login-framework-cli': minor
---

Add support for `header` and `footer` custom components. In `@forgerock/login-widget`, the registry accepts the two new component types, and header/footer components are opt-in via an `Enabled:` property in the `@component` comment block: a component with `Enabled: true` is bundled with the login app and rendered above/below the journey, at most one header and one footer may declare it (a second enabled component of the same type fails the registry build), and dormant components (no `Enabled` line, or `Enabled: false`) are skipped entirely. This replaces the `PUBLIC_CUSTOM_HEADER_NAME` / `PUBLIC_CUSTOM_FOOTER_NAME` environment-variable selection, which is removed along with the internal `selectRegistryEntry` utility. In `@forgerock/login-framework-cli`, add `generate header <Name>` and `generate footer <Name>` commands, the matching `ping-lf` MCP server tools, and the header/footer component templates they scaffold; scaffolding any header/footer component also triggers a registry rebuild, mirroring the existing stage/callback behavior.
