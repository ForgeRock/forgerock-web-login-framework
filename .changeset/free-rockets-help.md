---
'@forgerock/login-widget': minor
---

Fix journey restart after a failed suspended-journey resume (IAM-12006): a failed resume (e.g. expired suspend email link) now restarts into the correct journey — resolved from the URL or remembered per-browser (journey name and query params, persisted via `@forgerock/storage`) — instead of `start(undefined)`, which started the AM realm's default.
