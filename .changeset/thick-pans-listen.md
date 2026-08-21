---
'@forgerock/login-widget': minor
---

Add a `hideScriptedTextOutput` option to `configure()` that suppresses rendering of script-type text output (`TextOutputCallback` with `messageType` 4). The widget never executes these scripts, so it previously printed their source to the screen. Defaults to `false`, leaving existing behavior unchanged.
