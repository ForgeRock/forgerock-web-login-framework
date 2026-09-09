---
'@forgerock/login-widget': minor
---

Add a `style.callbacks.textOutput` option to `configure()` that suppresses rendering of text output by message type — a rule list of plain string dictionaries like `[{ type: '4', display: 'hidden' }]` hides script-type output (`TextOutputCallback` with `messageType` 4), whose source the widget prints to the screen because it never executes it. Rules are passed through to the callback renderer rather than strongly typed. Informational, warning, and error messages are unaffected.
