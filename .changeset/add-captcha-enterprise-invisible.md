---
'@forgerock/login-widget': minor
---

Add invisible reCAPTCHA v2, invisible hCaptcha, and reCAPTCHA Enterprise support.

- Support invisible mode for both Google reCAPTCHA v2 and hCaptcha via `configuration({ captcha: { mode: 'invisible' } })`.
- Add `ReCaptchaEnterpriseCallback` handler for AM journeys using the Enterprise CAPTCHA node — renders visible checkbox or score-based invisible flow automatically from callback data.
- Add `resolveGrecaptcha()` helper that prefers `window.grecaptcha.enterprise` and falls back to classic `window.grecaptcha`, keeping existing consumers with migrated keys working without changes.
- Show inline `<Alert type="error">` on CAPTCHA failure or expiry for invisible modes.
- Fix `renderCaptcha` to accept an optional `elementId` param to avoid DOM id collisions between classic and Enterprise components.
