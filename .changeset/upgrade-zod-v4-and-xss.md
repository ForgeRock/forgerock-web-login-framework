---
'@forgerock/login-widget': minor
---

Upgrade `zod` from `3.22.4` to `^4.3.6` and `xss` from `1.0.14` to `^1.0.15`.

- Migrate `core/sdk.config.ts` config schema to Zod v4: replace the removed
  `z.function().args().returns()` schema form with `z.custom<Fn>()` for the
  `callbackFactory`, `middleware`, and `tokenStore` function validators;
  collapse the `z.nativeEnum(CallbackType)` validator (which was part of the
  removed `z.function().args()` chain) into `z.custom<CallbackFactoryFn>()`; collapse
  `{ invalid_type_error, required_error }` into the unified `error`
  callback.
- Migrate `core/_utilities/i18n.utilities.ts` to the two-argument
  `z.record(keySchema, valueSchema)` form required by v4.
- The inferred public config surface (`z.infer<typeof partialConfigSchema>`)
  is preserved; no behavior change at runtime.
