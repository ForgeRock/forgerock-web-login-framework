---
'@forgerock/login-widget': minor
---

Add Page Node theme support. Parses a Page Node `themeId` out of the AM `stage` attribute (both the key=value and JSON shapes), adds `themeCatalog` to `configuration({ style })` keyed by IDM theme `_id`, and applies the resolved page theme over the base theme on the widget root — falling through to the base theme when the id is absent, unresolved, or no catalog was supplied. Logo height now also flows through the theme CSS var bridge via `--fr-logo-height`.
