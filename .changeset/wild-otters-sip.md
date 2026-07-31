---
'@forgerock/login-widget': patch
---

Restore v1.3.0 config parity and expose OIDC passthrough options:

- `logger` — forwarded to both clients. `logger.level` gates verbosity (replaces the removed `logLevel`); `logger.custom` redirects log output to your own sink.
- `middleware` — request middleware forwarded to both clients (v2 `(req, action, next) => void` shape).
- `oidcClient.storage` — token storage config; a `type` discriminated union of `'localStorage'`/`'sessionStorage'` (optional `prefix`/`name`) or `'custom'` (with a `{ get, set, remove }` sink).
- `oidcClient.oauthThreshold` — token refresh threshold (ms).
- `oidcClient.par` — use Pushed Authorization Requests.
- `oidcClient.signOutRedirectUri` — `post_logout_redirect_uri` for `user.logout()`.
- `oidcClient.loginHint`, `oidcClient.acrValues`, `oidcClient.query` — bridged onto the silent token-renewal request (`token.get`).
