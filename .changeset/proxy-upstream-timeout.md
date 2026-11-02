---
'@forgerock/login-widget': patch
---

Add a 2s upstream timeout to the Login2 app's AM proxy routes (authenticate, authorize, end-session, sessions, revoke, tokens, userinfo). A hung AM connection now fails fast with a 504 instead of pinning the SvelteKit request open, matching the existing session-validation timeout. The timeout covers the full upstream exchange, connection and response headers through the body, and the proxy routes now relay the upstream status code instead of always returning 200. An AM endpoint that cannot be reached at all (DNS failure, refused connection, TLS error) returns a 502 with an `upstream_unavailable` error body, and the synthesized timeout response now carries a JSON content-type.
