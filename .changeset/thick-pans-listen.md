---
'@forgerock/login-widget': minor
---

Add a `style.callbacks` option to `configure()` that carries per-callback style rules, keyed by AM callback type name — a rule list of plain string dictionaries like `{ TextOutputCallback: [{ type: '4', display: 'hidden' }] }` hides script-type output (`TextOutputCallback` with `messageType` 4), whose source the widget prints to the screen because it never executes it. Rules are passed through to the callback renderer rather than strongly typed, so new callback types can adopt the map without schema changes. Informational, warning, and error messages are unaffected.
