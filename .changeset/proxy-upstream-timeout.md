---
'@forgerock/login-widget': patch
---

Add a 2s upstream timeout to the Login2 app's AM proxy routes (authenticate, authorize, end-session, sessions, revoke, tokens, userinfo). A hung AM connection now fails fast with a 504 instead of pinning the SvelteKit request open, matching the existing session-validation timeout.
