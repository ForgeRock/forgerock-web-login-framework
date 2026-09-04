---
'@forgerock/login-widget': patch
---

Move logo theming from inline `style` attributes to root-level CSS custom properties, so every themed value flows through one mechanism:

- New `applyLogoVars` effect writes consumer logo config (`configure({ style: { logo } })`) as `--fr-logo-light-fallback`, `--fr-logo-dark-fallback`, `--fr-logo-height`, and `--fr-logo-width` on the widget root, re-applied after every theme pass.
- `.dialog-logo` / `.dialog-logo_dark` consume the fallback chain from the default theme CSS; the light/dark primary slots (`--logo-light` / `--logo-dark`) stay owned by the IDM/page-node theme, which now wins over static config.
- Inline logo `style` blocks (and `encodeCssUrl` usage) removed from the dialog composition, the login/generic stages, and the login-app admin-invite stages.
- Logo width can now be configured via `style.logo.width` (new `--fr-logo-width` var); the default height fallback is `4.5rem`.
- Invalid logo URLs (`style.logo.light` / `style.logo.dark`) are now dropped by config validation the same way as IDM theme logo URLs; valid values are `https://` URLs, `data:image/` URIs, or root-relative paths (leading `/`). A dropped value now also logs a console warning naming the config path and the rejected value, so consumers get a diagnostic when a previously-accepted logo URL form is rejected.
- Height and width of `0` are honored as configured (`0px`) rather than falling back to the default, matching the IDM theme `logoHeight` convention.
- Stage-rendered logos keep the pre-var inline defaults: 200px width when no width is configured, and the dialog header logo keeps stretching to the header height. Modal dialogs rendered without a header keep filling their container: the no-header logo falls back to `100%` of its `tw_h-32` container when no height is configured.
