---
'@forgerock/login-widget': patch
---

Remove the unused `APP_DOMAIN` export from `core/constants.ts`. It had no importers in the widget, the dev app, or the E2E suites; `AM_DOMAIN` (extracted from `FR_AM_URL`) remains the supported way to derive the AM host. No runtime behavior changes.
