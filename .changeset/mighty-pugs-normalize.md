---
'@forgerock/login-widget': patch
---

Normalize a leading slash in `FR_REALM_PATH` when `core/constants.ts` derives `JSON_REALM_PATH` and `OAUTH_REALM_PATH`, matching the `?realm=` override handling: a configured value of `/alpha` no longer produces `/json/realms/root/realms//alpha`.
