---
'@forgerock/login-widget': patch
---

Fix Alert:Info visual regression (green background in light mode, black background in dark mode) caused by additive CSS `calc()` lightness offsets becoming active once `--tw-colors-*` custom properties were injected by the IDM theming feature. Replaced the three broken additive expressions with multiplicative `calc(var(--l) * factor)` that replicates the `color` library's relative `lighten`/`darken` math correctly for any token value.
