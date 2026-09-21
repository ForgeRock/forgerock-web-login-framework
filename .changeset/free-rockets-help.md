---
'@forgerock/login-widget': minor
---

Add `journeys.fallbackJourney` to `configure()`, and fix journey restart after a failed suspended-journey resume (IAM-12006): a failed resume (e.g. expired suspend email link) now restarts into the correct journey — resolved from the URL, remembered per-browser (journey name and query params, persisted via `@forgerock/storage`), or the newly-configurable fallback (`fallbackJourney`) — instead of `start(undefined)`, which started the AM realm's default. The login-app passes `FR_AM_JOURNEY_LOGIN` through as this option.
