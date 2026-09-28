---
'@forgerock/login-widget': minor
---

Header and footer custom components are now opt-in via an `Enabled:` property in the `@component` comment block. A component with `Enabled: true` is bundled with the login app and rendered above/below the journey; at most one header and one footer may declare it (a second enabled component of the same type fails the registry build). Dormant components (no `Enabled` line, or `Enabled: false`) are skipped entirely. This replaces the `PUBLIC_CUSTOM_HEADER_NAME` / `PUBLIC_CUSTOM_FOOTER_NAME` environment-variable selection, which is removed along with the internal `selectRegistryEntry` utility.
