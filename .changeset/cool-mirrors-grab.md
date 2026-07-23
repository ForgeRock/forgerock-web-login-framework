---
'@forgerock/login-widget': major
---

Migrate OAuth/OIDC, user info, and logout from `@forgerock/javascript-sdk` to `@forgerock/oidc-client`, and Ping Protect from `@forgerock/ping-protect` to `@forgerock/protect`. `@forgerock/javascript-sdk` is no longer a dependency.

The synchronous `configuration()` export is replaced by an async `configure()`. Call and `await` it once with your settings — the two-step `configuration().set(...)` pattern is removed. `configure()` resolves only after the OIDC client is constructed, so `user.tokens().get()` / `user.info().get()` called immediately after no longer race a null client
