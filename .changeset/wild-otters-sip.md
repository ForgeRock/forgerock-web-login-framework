---
'@forgerock/login-widget': patch
---

Restore config options for parity with v1.3.0:

- `logLevel` (top level) — sets each client's `log`.
- `middleware` (top level) — forwarded to both clients as `requestMiddleware` (v2 `(req, action, next) => void` shape).
- `oidcClient.oauthThreshold` — token refresh threshold (ms).
- `oidcClient.tokenStore` — `'localStorage'` or `'sessionStorage'` (custom object stores no longer supported).
- `oidcClient.prefix` — token storage key prefix.

Expose OIDC passthrough options:

- `oidcClient.par` — use Pushed Authorization Requests.
- `oidcClient.signOutRedirectUri` — `post_logout_redirect_uri` for `user.logout()`.
- `oidcClient.loginHint`, `oidcClient.acrValues`, `oidcClient.query` — bridged onto the silent token-renewal request (`token.get`'s `authorizeOptions`), since the widget makes no interactive `authorize.url()` call.
