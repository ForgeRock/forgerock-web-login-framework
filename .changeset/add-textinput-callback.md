---
'@forgerock/login-widget': minor
---

Add `TextInputCallback` support in the login widget callback renderer.

- Map and render `TextInputCallback` using existing text input composition patterns.
- Include callback metadata handling so steps treat `TextInputCallback` as required user input.
- Add Storybook coverage and Playwright E2E coverage for submit flow and TextInput edge cases.
