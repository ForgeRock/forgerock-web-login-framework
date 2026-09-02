---
'@forgerock/login-widget': minor
---

Add a `style.callbacks.textOutput` option to `configure()` that suppresses rendering of text output by message type — `{ script: 'hidden' }` hides script-type output (`TextOutputCallback` with `messageType` 4), whose source the widget prints to the screen because it never executes it. Informational, warning, and error messages are unaffected.
