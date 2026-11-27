---
'@forgerock/login-widget': minor
---

New `customComponents` configure option. Pass `manifest` (the tenant's manifest endpoint URL) and the widget fetches the latest published custom component bundle at configure time, so new publishes need no host change or restart. Pass `url` instead to load a bundle directly. Exactly one is required.
