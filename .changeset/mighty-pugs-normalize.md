---
'@forgerock/login-widget': patch
---

Normalize `FR_REALM_PATH` and `FR_AM_URL` when `core/constants.ts` derives the AM endpoint constants: a leading slash in the realm (`/alpha` no longer produces `/json/realms/root/realms//alpha`) and a trailing slash on the AM URL (which made every proxied AM call fail with "Resource path contains empty path elements") are both stripped, matching the `?realm=` override handling.
