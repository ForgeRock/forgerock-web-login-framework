---
'@forgerock/login-widget': minor
---

Add LinkedIn and Microsoft Entra ID as OOTB identity providers in the SelectIdP callback.

- LinkedIn: matches `buttonDisplayName` containing `'LinkedIn'`, renders branded button with `#0077b5` background and the LinkedIn "in" logo.
- Microsoft/Entra ID: matches `buttonDisplayName` containing `'Microsoft'`, renders branded button with `#0072c6` background and the 4-color Microsoft squares logo.
- Dark mode variants for both providers follow the existing pattern (white background, brand-color text).
- Unknown providers continue to render nothing — no change to existing fallback behavior.
