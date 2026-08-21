---
'@forgerock/login-framework-cli': patch
---

Fix `generate stage <Name>` producing incorrect slugs for PascalCase stage names (e.g. `MyCustomStage` → `mycustomstage` instead of `my-custom-stage`). Stage slugs now hyphenate at word and acronym boundaries the same way callback slugs do.
