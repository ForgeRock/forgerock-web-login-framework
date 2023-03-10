<script>
  export let data;
</script>

# Overview

The { data.package.name } produced by this framework is intended to be an all-inclusive, UI component that can be used within any modern JavaScript app for handling the default login, registration and related user flows within the ForgeRock Platform. It can be used within a React, Vue, Angular or any other modern JavaScript framework (does not currently support Node.js or server-side rendering (SSR)).

This Widget uses the ForgeRock JavaScript SDK internally. It adds a UI rendering layer on top of the SDK to help eliminate the need to develop and maintain the UI components necessary for providing complex authentication flows. Although this rendering layer is developed with Svelte and Tailwind, it is "compiled away" and has no runtime dependencies. It is library and framework agnostic, meaning it can be used with React, Angular, Vue, et cetera.

## Form Factors

This Widget can be rendered in two different types (or "form factors"):

1. **Modal** type: this is the default and the recommended way to use the widget at first. It renders the form elements inside a modal dialog that can be opened and closed. This component is mounted _outside_ of your app's controlled DOM.
2. **Inline** type: this is just the form elements themselves, no container. This component is intended to be rendered _inside_ your app's controlled DOM.

Both components provide the same authentication, OAuth/OIDC and user features. The only difference is how the component is rendered within your app.

**Start with the modal type!** It is highly recommended to start with the Modal form factor when in the experimenting or prototyping phase. It provides the quickest development experience for providing login and registration flows into your app with the least disruption to your existing codebase. The Modal will be controlled within your app, but rendered in its own DOM root node and visual layer.

View our ["Quick Start" section if you'd like a quick introduction](/docs/widget/quick-start). Or, visit our ["Full API" section for in-depth docs](/docs/widget/full-api) on the Widget's feature set.
