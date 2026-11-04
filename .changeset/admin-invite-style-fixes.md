---
'@forgerock/login-widget': patch
---

Fix dark-mode styling on admin invite screens and keep the privacy-policy checkbox out of the tab order until a jurisdiction is selected:

- Animated checkbox label content no longer breaks inline links out of the grid layout.
- The privacy-policy stage's checkbox block is hidden (`tw_invisible`) until the jurisdiction select has a value, so Tab skips it.
