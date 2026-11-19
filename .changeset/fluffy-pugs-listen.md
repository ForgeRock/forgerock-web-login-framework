---
'@forgerock/login-widget': minor
---

Add runtime Custom Component bundle support: new `configure()` option `customComponents: { url }` fetches and registers an external bundle of custom stage/callback components at startup. Components resolve in order: runtime bundle, compile-time custom registry, built-ins. Contract documented in `core/journey/_utilities/registry/BUNDLE_CONTRACT.md`.
