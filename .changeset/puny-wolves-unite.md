---
'@forgerock/login-widget': patch
---

Fix silent token renewal to use explicit PKCE authorize+exchange flow:

- Removes hardcoded `backgroundRenew: true` from `token.get()`. The widget no longer passes that option to the OIDC client.
- Adds `background()` and `exchange()` to the OAuth store. After a journey completes, the widget calls `authorize.background()` to obtain an auth code, stores it transiently, then calls `token.exchange()` to exchange it for tokens. Previously this was handled opaquely inside the SDK via `backgroundRenew`.
- `OAuthTokenStoreValue` gains `code: string | null` and `state: string | null` fields that carry the auth code between the two steps. Both are `null` in all other states.
- `initialize()` now receives the full `oidcClient` config (instead of `GetTokensOptions`) so `authorizeOptions` (`clientId`, `redirectUri`, `scope`, `loginHint`, `acrValues`, `query`) are forwarded correctly to both `authorize.background()` and `token.get()`.
