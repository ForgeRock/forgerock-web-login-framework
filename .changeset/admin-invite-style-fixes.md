---
'@forgerock/login-widget': patch
---

Fix dark-mode styling on admin invite screens and thread `tabindex` through the checkbox composition/primitive chain:

- `Checkbox`/`Standard`/`Animated`/checkbox primitive now accept an optional `tabindex` prop.
- Animated checkbox label content no longer breaks inline links out of the grid layout.
