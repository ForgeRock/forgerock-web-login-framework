## Overview

The Login Widget produced by this framework is intended to be an all-inclusive, UI component that can be used within any modern JavaScript app for handling the default login, registration and related user flows within the ForgeRock Platform. It can be used within a React, Vue, Angular or any other modern JavaScript framework (does not currently support Node.js or server-side rendering (SSR)).

This Widget uses the ForgeRock JavaScript SDK internally. It adds a UI rendering layer on top of the SDK to help eliminate the need to develop and maintain the UI components necessary for providing complex authentication flows. Although this rendering layer is developed with Svelte and Tailwind, it is "compiled away" and has no runtime dependencies. It is library and framework agnostic.

## Form Factors

This Widget can be used in two different ways (or "form factors"):

1. **Modal** component: this renders the form elements inside a modal dialog that can be opened and closed. This component is mounted outside of your app's controlled DOM.
2. **Inline** component: this is just the form elements themselves, no container. This component is intended to be rendered inside your app's controlled DOM.

Both components provide the same authentication, token and user features. The only difference is how the component is rendered within your app.

The Modal component is recommended as it provides the quickest development experience for providing login and registration flows into your app with the least disruption to your codebase. The Modal will be controlled within your app, but rendered in its own DOM root node and visual layer.

For example:

```html
<!DOCTYPE html>
<html lang="en">
  <head></head>
  <body>
    <div id="react-root">
      <!--
        Contents of this div are controlled by React or Vue via the Virtual DOM
      -->
    </div>
    <!--
      Outside of React or Vue's controlled DOM
    -->
    <div id="widget-root"></div>
  </body>
</html>
```

The Inline component, on the other hand, allows you to render the resulting form within your app's controlled DOM and visual layer (rather than on top of it) in whatever way is best for you, but there are some caveats to understand.

For example:

```html
<!DOCTYPE html>
<html lang="en">
  <head></head>
  <body>
    <div id="react-root">
      <!--
        Contents of this div are controlled by React or Vue via the Virtual DOM

        Widget's root will need to be _mounted_ inside this "controlled" div by
        React or Vue **before** instantiating Widget
      -->
    </div>
  </body>
</html>
```

View our ["Quick Start" section if you'd like a quick introduction](/docs/widget/quick-start). Or, visit our ["Full API" section for in-depth docs](/docs/widget/full-api) on the Widget's feature set.
