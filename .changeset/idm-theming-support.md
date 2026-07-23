---
'@forgerock/login-widget': minor
---

Add IDM theming support. Consumers can now pass a `theme` object to `await configure({ style: { theme } })` to apply design tokens as CSS custom properties on the widget root. Supports `primaryColor`, `secondaryColor`, `backgroundColor`, `linkColor`, `linkActiveColor`, `fontFamily`, `buttonBorderRadius`, `cardBorderRadius`, `cardBgColor`, `inputBgColor`, `inputBorderColor`, `inputLabelColor`, `inputTextColor`, `inputFocusRingColor`, `selectAccentColor`, `selectHoverBgColor`, `cardTextColor`, `bodyTextColor`, `buttonTextColor`, `buttonFocusRingColor`, `logo`, `logoHeight`, and `primaryOffColor`. The Login App SSR layer fetches theme values from the IDM `/openidm/config/ui/themerealm` endpoint automatically.
