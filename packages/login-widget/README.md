[![npm version](https://img.shields.io/npm/v/@forgerock/login-widget?color=%23f46200&style=flat-square)](https://www.npmjs.com/package/@forgerock/login-widget)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

<p align="center">
  <a href="https://github.com/ForgeRock">
    <img src="https://www.forgerock.com/themes/custom/forgerock/images/fr-logo-horz-color.svg" alt="ForgeRock Logo">
  </a>
  <h2 align="center">ForgeRock Login Widget</h2>
  <p align="center">
    <a href="https://www.npmjs.com/package/@forgerock/login-widget">npm</a>
    ·
    <a href="#support">Support</a>
    ·
    <a href="https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework.html">Docs</a>
  </p>
  <hr/>
</p>

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
  - [Install](#install)
  - [Add CSS](#add-css)
  - [Mount the Widget](#mount-the-widget)
- [Observables Pattern](#observables-pattern)
  - [Subscribe to Events](#subscribe-to-events)
  - [Unsubscribe](#unsubscribe)
  - [Get Current Values](#get-current-values)
  - [Request Fresh Values](#request-fresh-values)
  - [Use Promises](#use-promises)
- [Complete Widget API](#complete-widget-api)
  - [Widget](#widget)
  - [Configuration](#configuration)
  - [Journey](#journey)
  - [Component](#component)
  - [User](#user)
  - [Request](#request)
  - [Styling Configuration](#styling-configuration)
  - [Links Configuration](#links-configuration)
  - [Content Configuration](#content-configuration)
- [Supported Callbacks](#supported-callbacks)
- [Disclaimer](#disclaimer)
- [License](#license)

## Overview

The Login Widget is an all-inclusive UI component for handling login, registration, and related user flows in any modern JavaScript app. It works with React, Vue, Angular, Svelte, or vanilla JavaScript — it does not currently support Node.js or server-side rendering (SSR).

The widget uses the ForgeRock JavaScript SDK internally. It adds a UI rendering layer on top of the SDK to eliminate the need to develop and maintain UI components for complex authentication flows. Although this rendering layer is developed with Svelte and Tailwind, both are "compiled away" and have no runtime dependencies. The resulting widget is library- and framework-agnostic.

The widget can be rendered in two form factors:

1. **Modal** (default): Renders form elements inside a modal dialog that opens and closes. Mounted _outside_ your app's controlled DOM.
2. **Inline**: Just the form elements with no container. Mounted _inside_ your app's controlled DOM.

Both form factors provide the same authentication, OAuth/OIDC, and user features. Start with Modal — it provides the quickest path to adding login/registration with minimal disruption to your existing codebase.

## Requirements

- An ECMAScript module or CommonJS enabled client-side JavaScript app
- A modern, fully-supported browser: Chrome, Firefox, Safari, or Chromium Edge

**Not supported**: Internet Explorer, Legacy Edge, WebView, Electron, and other modified browser-like environments.

## Quick Start

### Install

```shell
npm install @forgerock/login-widget
```

### Add CSS

Import into your JavaScript:

```js
import '@forgerock/login-widget/widget.css';
```

Import into your CSS:

```css
@import '@forgerock/login-widget/widget.css';
```

Or link in HTML (copy the CSS file from the npm module into your static files):

```html
<link rel="stylesheet" href="/path/to/file/widget.css" />
```

#### Controlling the CSS Cascade

Though not required, using `@layer` ensures the browser applies CSS in the intended order regardless of import order. [Read more about @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).

1. Wrap your CSS in a layer:

   ```css
   @layer app {
     /* Your app's CSS */
   }
   ```

2. Declare layer order in your HTML before any CSS loads:

   ```html
   <style type="text/css">
     @layer app;
     @layer 'fr-widget.base';
     @layer 'fr-widget.utilities';
     @layer 'fr-widget.components';
     @layer 'fr-widget.variants';
   </style>
   ```

   Widget CSS is fully namespaced — it will not overwrite your app's CSS unless you use the same selector naming convention.

### Mount the Widget

Add a dedicated element to your HTML file as a direct child of `<body>`, separate from your main app root:

```html
<body>
  <div id="root"></div>
  <div id="widget-root"></div>
</body>
```

> **Tip**: Do not mount the modal form factor on a dynamic element inside your app's Virtual DOM. Hard-code it in your static HTML file.

Import, configure, and instantiate:

```js
import Widget, { configuration, journey } from '@forgerock/login-widget';

// 1. Configure
const config = configuration();
config.set({
  forgerock: {
    serverConfig: {
      baseUrl: 'https://your-tenant.forgeblocks.com/am/',
      timeout: 3000,
    },
  },
});

// 2. Instantiate
const widgetRootEl = document.getElementById('widget-root');
new Widget({ target: widgetRootEl });

// 3. Start a journey
const journeyEvents = journey();
journeyEvents.start();
```

> **Tip**: Set configuration at the top level of your application (`index.js` or `app.js`) to ensure it is available before calling `journeyEvents.start()` or any other Widget API.

## Observables Pattern

Most Widget APIs are asynchronous and use an event-centric observable pattern. The widget uses Svelte's simplified, standard observable implementation called a "store" — these are embedded in the widget and are not a dependency your app needs to manage.

[Read more about the Svelte store contract](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract).

### Subscribe to Events

```js
import { user } from '@forgerock/login-widget';

const userInfoEvents = user.info();

userInfoEvents.subscribe((event) => {
  if (event.loading) {
    console.log('User info is being requested from server');
  } else if (event.successful) {
    console.log('User info request was successful');
    console.log(event.response);
  } else if (event.error) {
    console.error('User info request failed');
    console.error(event.error.message);
  }
});
```

### Unsubscribe

Observables are not like Promises — they don't resolve and get cleaned up. You must unsubscribe when no longer needed, especially in components that are created and destroyed frequently:

```js
const unsubscribe = userInfoEvents.subscribe((event) => console.log(event));

// Later, when no longer needed:
unsubscribe();
```

> **Note**: If subscribing at a top-level component that persists over the lifetime of your app, unsubscribing is not needed.

### Get Current Values

To get the current value stored within the Widget without subscribing to future events, call `subscribe` and immediately call the returned unsubscribe function:

```js
let userInfo;
userInfoEvents.subscribe((event) => (userInfo = event.response))();
```

### Request Fresh Values

Call action methods like `get` to request new values from the server. Any active `subscribe` callbacks will receive the resulting events:

```js
userInfoEvents.get();
```

### Use Promises

All Widget APIs that involve network calls also support Promises:

```js
// async/await
const userInfo = await userInfoEvents.get();

// Promise chain
userInfoEvents
  .get()
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

## Complete Widget API

### Widget

```js
import Widget from '@forgerock/login-widget';

// Instantiate
const widget = new Widget({
  target: widgetRootEl, // REQUIRED; a real DOM element
  props: {
    type: 'modal', // OPTIONAL; "modal" (default) or "inline"
  },
});

// Remove widget from DOM and destroy listeners
widget.$destroy();
```

> **Note**: Call `$destroy()` if instantiating the Widget in a component that is frequently created and destroyed. We recommend instantiating higher in your application tree, in a component created once and preserved.

### Configuration

```js
import { configuration } from '@forgerock/login-widget';

const config = configuration();
config.set({
  forgerock: {
    // REQUIRED
    serverConfig: {
      baseUrl: 'https://your-tenant.forgeblocks.com/am',
      timeout: 3000,
    },
    // OPTIONAL (defaults shown)
    clientId: 'WebLoginWidgetClient',
    realmPath: 'alpha',
    redirectUri: window.location.href,
    scope: 'openid email',
  },
  // OPTIONAL — see dedicated sections below
  content: {},
  links: {},
  style: {},
});
```

For more SDK configuration options, see the [SDK configuration documentation](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/04-configure-sdk.html#sdk_configuration_properties).

### Journey

```js
import { journey } from '@forgerock/login-widget';

const journeyEvents = journey({
  oauth: true, // OPTIONAL; default true; use OAuth flow for tokens
  user: true, // OPTIONAL; default true; fetch user info from /userinfo
});

// Start a journey
journeyEvents.start({
  forgerock: {}, // OPTIONAL; configuration overrides
  journey: 'Login', // OPTIONAL; journey/tree name (defaults to server default)
  resumeUrl: window.location.href, // OPTIONAL; URL for resuming a suspended journey
});

// Change to a different journey
journeyEvents.change({
  forgerock: {},
  journey: 'Registration',
});

// Listen for events
journeyEvents.subscribe((event) => {
  if (event.journey.successful) {
    console.log('Authentication succeeded', event);
  }
});
```

**Journey event schema:**

```js
{
  journey: {
    completed: false,     // boolean
    error: null,          // null or { code, message, step }
    loading: false,       // boolean
    step: null,           // null or step object from ForgeRock AM
    successful: false,    // boolean
    response: null,       // null or success response from AM
  },
  oauth: {
    completed: false,     // boolean
    error: null,          // null or { code, message }
    loading: false,       // boolean
    successful: false,    // boolean
    response: null,       // null or OAuth/OIDC tokens
  },
  user: {
    completed: false,     // boolean
    error: null,          // null or { code, message }
    loading: false,       // boolean
    successful: false,    // boolean
    response: null,       // null or user info (driven by OAuth scope)
  },
}
```

### Component

The `component` API controls the widget's lifecycle. For the modal form factor, it provides `open` and `close` methods.

```js
import { component } from '@forgerock/login-widget';

const componentEvents = component();

// Open/close the modal
componentEvents.open();
componentEvents.close();

// Listen for lifecycle events
componentEvents.subscribe((event) => {
  if (event.mounted) console.log('Widget is mounted');
  if (event.open === false) console.log('Modal closed:', event.reason);
});
```

**Component event schema:**

```js
{
  error: null,    // null or { code, message, step }
  mounted: false, // boolean
  open: null,     // boolean or null (null for inline type)
  reason: null,   // "user" | "auto" | "external"
  type: null,     // "modal" | "inline"
}
```

**Close reasons:**

| Reason       | Description                                  |
| ------------ | -------------------------------------------- |
| `"user"`     | User closed the dialog via UI                |
| `"auto"`     | Modal closed after successful authentication |
| `"external"` | Application called `componentEvents.close()` |

### User

```js
import { user } from '@forgerock/login-widget';

// User info
const userEvents = user.info();
userEvents.subscribe((event) => console.log(event));
userEvents.get(); // Fetch fresh user info from server

// User tokens
const tokenEvents = user.tokens();
tokenEvents.subscribe((event) => console.log(event));
tokenEvents.get(); // Fetch fresh tokens from server

// Logout
user.logout(); // Clears user data and emits events to subscribers
```

**User info / token event schema:**

```js
{
  completed: false,  // boolean
  error: null,       // null or { code, message }
  loading: false,    // boolean
  successful: false, // boolean
  response: null,    // object from /userinfo or /access_token endpoint
}
```

### Request

An alias to the JavaScript SDK's `HttpClient.request` — a convenience wrapper around `fetch` that auto-injects the Access Token into the `Authorization` header.

```js
import { request } from '@forgerock/login-widget';

const response = await request({
  url: 'https://protected.resource.com',
  init: { method: 'GET' },
});
```

**Options:**

```js
{
  bypassAuthentication: false,  // Boolean; skip token injection
  init: {},                     // fetch() options
  timeout: 3000,                // Fetch timeout in milliseconds
  url: '',                      // Resource URL
}
```

> **Note**: The response is a native [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object and is not persisted in the widget.

### Styling Configuration

Configure the widget's visual appearance:

```js
config.set({
  style: {
    checksAndRadios: 'animated', // OPTIONAL; 'animated' or 'standard'
    labels: 'floating', // OPTIONAL; 'floating' or 'stacked'
    logo: {
      // OPTIONAL; modal only
      dark: 'https://example.com/img/white-logo.png',
      light: 'https://example.com/img/black-logo.png', // REQUIRED if logo provided
      height: 300,
      width: 400,
    },
    sections: {
      // OPTIONAL; modal only
      header: false, // Display a header section with logo
    },
    stage: {
      icon: true, // OPTIONAL; display generic stage icons
    },
  },
});
```

> **Note**: The `logo` and `sections` properties only apply to the modal form factor.

### Links Configuration

Set the URL for your Terms & Conditions page (used by `TermsAndConditionsCallback`):

```js
config.set({
  links: {
    termsAndConditions: 'https://example.com/terms',
  },
});
```

### Content Configuration

Override the widget's default content with custom text. For the full schema, see the [en-US locale file](https://github.com/ForgeRock/forgerock-web-login-framework/tree/main/core/locales).

```js
config.set({
  content: {
    // Custom content that overrides Widget defaults
  },
});
```

## Supported Callbacks

The widget supports the following ForgeRock callbacks:

- Page node
- Username, Password
- WebAuthn (registration and login)
- Push authentication
- One-time password verification
- Social login (Apple, Facebook, Google)
- Email suspend ("magic links")
- Device profile
- reCAPTCHA / hCaptcha
- QR codes
- Ping Protect

## Disclaimer

> **This code is provided by ForgeRock on an "as is" basis, without warranty of any kind, to the fullest extent permitted by law. ForgeRock does not represent or warrant or make any guarantee regarding the use of this code or the accuracy, timeliness or completeness of any data or information relating to this code, and ForgeRock hereby disclaims all warranties whether express, or implied or statutory, including without limitation the implied warranties of merchantability, fitness for a particular purpose, and any warranty of non-infringement. ForgeRock shall not have any liability arising out of or related to any use, implementation or configuration of this code, including but not limited to use for any commercial purpose. Any action or suit relating to the use of the code may be brought only in the courts of a jurisdiction wherein ForgeRock resides or in which ForgeRock conducts its primary business, and under the laws of that jurisdiction excluding its conflict-of-law provisions.**

## License

This project is licensed under the MIT License — see the [LICENSE](https://github.com/ForgeRock/forgerock-web-login-framework/blob/main/LICENSE) file for details.

---

&copy; Copyright 2022-2025 Ping Identity Corporation. All Rights Reserved.
