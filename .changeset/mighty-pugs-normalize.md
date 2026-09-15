---
'@forgerock/login-widget': patch
---

Normalize `FR_REALM_PATH` and `FR_AM_URL` wherever the login app consumes them: `core/constants.ts` strips a leading realm slash (`/alpha` no longer produces `/json/realms/root/realms//alpha`) and a trailing URL slash (which made every proxied AM call fail with "Resource path contains empty path elements"), and `createRedirectContext` strips the realm fallback the same way so the role redirect no longer sees `?realm=//alpha`.
