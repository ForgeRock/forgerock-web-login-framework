[![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/ForgeRock/forgerock-web-login-framework?color=%23f46200&label=Version&style=flat-square)](CHANGELOG.md)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release: conventional](https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

<p align="center">
  <a href="https://github.com/ForgeRock">
    <img src="https://www.forgerock.com/themes/custom/forgerock/images/fr-logo-horz-color.svg" alt="Logo">
  </a>
  <h2 align="center">ForgeRock Web Login Framework</h2>
  <p align="center">
    <a href="package/CHANGELOG.md">Change Log</a>
    ·
    <a href="#support">Support</a>
    ·
    <a href="#documentation">Docs</a>
  </p>
  <hr/>
</p>

## Table of contents

- [Overview](#overview)
- [Functionality](#functionality)
  - [Supported](#supported)
  - [Net yet supported](#net-yet-supported)
- [Requirements](#requirements)
  - [Tested](#tested)
  - [Unsupported](#unsupported)
- [Getting Started](#getting-started)
  - [Install the ForgeRock Login Widget with npm](#install-the-forgerock-login-widget-with-npm)
  - [Import the CSS](#import-the-css)
  - [Import the widget](#import-the-widget)
  - [Configure the SDK](#configure-the-sdk)
  - [Instantiate the widget](#instantiate-the-widget)
    - [Choose where to mount the ForgeRock Login Widget](#choose-where-to-mount-the-forgerock-login-widget)
    - [Instantiate the modal form factor](#instantiate-the-modal-form-factor)
  - [Start a journey](#start-a-journey)
  - [Subscribe to events](#subscribe-to-events)
    - [Assign an observable](#assign-an-observable)
    - [Subscribe to observable events](#subscribe-to-observable-events)
    - [Unsubscribe from an observable](#unsubscribe-from-an-observable)
    - [Get current local values](#get-current-local-values)
    - [Get updated values from ForgeRock](#get-updated-values-from-forgerock)
    - [Use promises rather than observables](#use-promises-rather-than-observables)
- [Documentation](#documentation)
- [Support](#support)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

<!--------------------------------------------------------------------------------------------------------------->
<!-- OVERVIEW -->

## Overview

The ForgeRock Login Widget is an all-inclusive UI component to help you add authentication,
user registration, and other self-service flows into your web applications.

You can use the ForgeRock Login Widget within React, Vue, Angular, and a number of other modern JavaScript frameworks, as well as vanilla JavaScript.

It does not currently support server-side rendering (SSR), including Node.js.

The ForgeRock Login Widget uses the [ForgeRock SDK for JavaScript](https://backstage.forgerock.com/docs/sdks/latest/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html) internally, and adds a user interface and state management. This rendering layer helps eliminate the need to develop and maintain the UI components for providing complex authentication flows.

ForgeRock develops this rendering layer using [Svelte](https://svelte.dev/) and [Tailwind](https://tailwindcss.com/), but these are "compiled away" resulting in no runtime dependencies.

The resulting ForgeRock Login Widget is both library- and framework-agnostic.

<!--------------------------------------------------------------------------------------------------------------->
<!-- FUNCTIONALITY -->

## Functionality

The ForgeRock Login Widget supports the following ForgeRock functionality:

### Supported

- Page node
- Username, Password
- Push authentication
- One-time password verification
- Social login
  - Supported providers:
    - Apple
    - Facebook
    - Google
- Email suspend, or "magic links"

### Net yet supported

- WebAuthn
- Centralized login
- Push registration
- One-time password registration
- reCAPTCHA
- QR codes
- `TextOutputCallback` callbacks containing scripts
- Device profile
- SAML federation

<!--------------------------------------------------------------------------------------------------------------->
<!-- REQUIREMENTS -->

## Requirements

The ForgeRock Login Widget is designed to work with the following:

- An ECMAScript module or CommonJS enabled client-side JavaScript app
- A "modern", fully featured browser such as Chrome, Firefox, Safari, or Chromium Edge

The ForgeRock Login Widget supports vanilla JavaScript and many frameworks. It is tested against the following:

### Tested

- Angular
- React
- Vue
- Svelte

### Unsupported

- Server-side rendering (SSR), including Node.js

The ForgeRock Login Widget is _*not designed or tested*_ for use with the following:

- Internet Explorer
- Legacy Edge
- WebView
- Electron
- Modified, browser-like environments

<!--------------------------------------------------------------------------------------------------------------->
<!-- TUTORIAL -->

## Getting Started

This section guides you through adding the ForgeRock Login Widget to your application in the modal form factor.

### Install the ForgeRock Login Widget with npm

Add the ForgeRock Login Widget to your project using npm as follows:

```shell
npm install @forgerock/login-widget
```

If you want to customize the themes included in the Login Widget, you need to download the ForgeRock Web Login Framework source, make your modifications, and build a customized package. Refer to [Build a customized ForgeRock Login Widget](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/01-install.html#build).

### Import the CSS

You can use any of the following methods to add the default ForgeRock Login Widget styles to your app:

1. Import it into your JavaScript project as a module.
2. Import it using a CSS preprocessor, like Sass, Less, or PostCSS.

If you decide to import the CSS into your JavaScript, make sure your bundler is able to import and process the CSS as a module. If using a CSS preprocessor, configure your preprocessor to access files from within your `node_modules` directory.

> **TIP**
>
> When prototyping or troubleshooting your application, you could copy the file and paste it into your project for linking in the HTML.
>
> In production builds you should reference the CSS from the npm module, to ensure you are getting the latest changes.

Importing into your JavaScript:

```js
// app.js
import '@forgerock/login-widget/widget.css';
```

Importing into your CSS:

```css
/* style.css */
@import '@forgerock/login-widget/widget.css';
```

The exact syntax for importing the CSS depends on the module system you are using.

For information on using the CSS `layer` feature with the Login Widget, refer to [Controlling the CSS cascade](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/02-configure-css.html#controlling_the_css_cascade).

### Import the widget

To use the ForgeRock Login Widget, import the modules you want to use into your app:

```js
// Import the ForgeRock Login Widget
import Widget, { configuration } from '@forgerock/login-widget';
```

The exact syntax for importing the widget depends on the module system you are using.

### Configure the SDK

The ForgeRock Login Widget requires information about the server instance it connects to, as well as OAuth 2.0 client configuration and other settings.

To provide these settings import and use the configuration module and its `set()` method.

The ForgeRock Login Widget uses the same underlying [configuration properties](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/04-configure-sdk.html#config-props) as the SDK for JavaScript. Add your configuration under the `forgerock` property:

```js
// Import the modules
import Widget, { configuration } from '@forgerock/login-widget';

// Create a configuration instance
const myConfig = configuration();

// Set the configuration properties
myConfig.set({
  forgerock: {
    // Minimum required configuration:
    serverConfig: {
        baseUrl: 'https://openam-forgerock-sdks.forgeblocks.com/am/',
        timeout: 3000,
    },
    // Optional configuration:
    clientId: 'ForgeRockSDKClient', // The default is `WebLoginWidgetClient`
    realmPath: 'alpha',  // This is the default if not specified
    redirectUri: window.location.href,  // This is the default if not specified
    scope: 'openid profile', // This is the default if not specified
    },
  },
});
```

> **TIP**
>
> Set your ForgeRock Login Widget configuration at the top level of your application, such as its `index.js` or `app.js` file.
>
> This ensures the ForgeRock Login Widget has the configuration needed to call out to the ForgeRock platform whenever and wherever you use its APIs in your app.
>
> For example, you must set the configuration before starting a journey with `journeyEvents.start()` or calling either `userEvents.get()` or `tokenEvents.get()`.

For more information on the available properties, refer to [SDK configuration properties](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/04-configure-sdk.html#sdk_configuration_properties).

### Instantiate the widget

To use the ForgeRock Login Widget in your app you must choose an appropriate place to mount it. You can then instantiate the ForgeRock Login Widget in your app, ready for your users to start their authentication or self-service journey.

#### Choose where to mount the ForgeRock Login Widget

To implement the ForgeRock Login Widget, we recommend you add a new element into your HTML file.

For most single page applications (SPA) this is your `index.html` file.

This new element should be a direct child element of <body> and not within the element where you mount your SPA.

```html
<!doctype html>
<html lang="en">
  <head>
    <!-- ... -->
  </head>
  <body>
    <!-- Root element for main app -->
    <div id="root"></div>

    <!-- Root element for Widget -->
    <div id="widget-root"></div>

    <!-- scripts ... -->
  </body>
</html>
```

> **TIP**
>
> We recommend that you do not inject the element into which you mount the modal form factor in your app. This can cause virtual DOM issues.
>
> Instead, manually hard-code the element in your HTML file.

#### Instantiate the modal form factor

To use the default ForgeRock Login Widget modal form factor, import the modules into your app and instantiate the widget as follows:

```js
// Import the ForgeRock Login Widget
import Widget, { configuration } from '@forgerock/login-widget';

// Configure SDK options
const myConfig = configuration();

myConfig.set({
  forgerock: {
    serverConfig: {
        baseUrl: 'https://openam-forgerock-sdks.forgeblocks.com/am/',
        timeout: 3000,
    },
    // Optional but recommended configuration:
    realmPath: 'alpha',
    clientId: 'ForgeRockSDKClient',
    redirectUri: window.location.href,
    scope: 'openid email'
    },
  },
});

// Get the element in your HTML into which you will mount the widget
const widgetRootEl = document.getElementById('widget-root');

// Instantiate Widget with the `new` keyword
new Widget({
  target: widgetRootEl,
});
```

This mounts the ForgeRock Login Widget into the DOM. The modal form factor is the default and is hidden when first instantiated.

To open the modal, import the `component` module, assign the function, and call its `open()` method:

```js
// Import the ForgeRock Login Widget
import Widget, { configuration, component } from '@forgerock/login-widget';

// Configure SDK options
const myConfig = configuration();

myConfig.set({
  forgerock: {
    serverConfig: {
        baseUrl: 'https://openam-forgerock-sdks.forgeblocks.com/am/',
        timeout: 3000,
    },
    // Optional but recommended configuration:
    realmPath: 'alpha',
    clientId: 'ForgeRockSDKClient',
    redirectUri: window.location.href,
    scope: 'openid email'
    },
  },
});

// Get the element in your HTML into which you will mount the widget
const widgetRootEl = document.getElementById('widget-root');

// Instantiate Widget with the `new` keyword
new Widget({
  target: widgetRootEl, // Any existing element from static HTML file
});

// Assign the component function
const componentEvents = component();

// Call the open() method, for example after a button click
const loginButton = document.getElementById('loginButton');

loginButton.addEventListener('click', () => {
  componentEvents.open();
});
```

The modal form factor opens and displays a spinner graphic until you start a journey.

> **TIP**
>
> The modal form factor closes itself when a journey completes successfully.
>
> You can also close it by calling `componentEvents.close()`;

For information on using the widget's inline form factor, refer to [Instantiate the inline form factor](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/05-instantiate.html#inline).

### Start a journey

The ForgeRock Login Widget displays a loading spinner graphic if it does not yet have a callback from the server to render.

You must specify and start a journey to make the initial call to the server and obtain the first callback.

To start a journey, import the `journey` function and execute it to receive a `journeyEvents` object. After you have this `journeyEvents` object, you can call the `journeyEvents.start()` method, which starts making requests to the ForgeRock server for the initial form fields.

You can call the `journeyEvents.start()` method anywhere in your application, or anytime, as long as it is after calling the configuration’s `set()` method and after instantiating the Widget.

```js
// Import the ForgeRock Login Widget
import Widget, { configuration, journey, component } from '@forgerock/login-widget';

// Configure SDK options
const myConfig = configuration();

myConfig.set({
  forgerock: {
    serverConfig: {
        baseUrl: 'https://openam-forgerock-sdks.forgeblocks.com/am/',
        timeout: 3000,
    },
    // Optional but recommended configuration:
    realmPath: 'alpha',
    clientId: 'ForgeRockSDKClient',
    redirectUri: window.location.href,
    scope: 'openid email'
    },
  },
});

// Get the element in your HTML into which you will mount the widget
const widgetRootEl = document.getElementById('widget-root');

// Instantiate Widget with the `new` keyword
new Widget({
  target: widgetRootEl,
});

// Assign the journey function
const journeyEvents = journey();

// Ensure you call `.start` *AFTER* instantiating the Widget
journeyEvents.start();
```

This starts the journey configured as the default in your ForgeRock server and renders the initial callback.

For information about how to specify which journey to use and other parameters, refer to [Configure start() parameters](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/06-journey.html#journey-params).

### Subscribe to events

The ForgeRock Login Widget has a number of asynchronous APIs, which are designed around an event-centric _observable_ pattern. It uses Svelte’s simplified, standard observable implementation called a "store".

> **NOTE**
>
> These Svelte stores are embedded into the ForgeRock Login Widget itself.
>
> They are not a dependency that your app layer needs to import or manage.

For more information on Svelte stores, refer to the [Svelte documentation](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract).

This observable pattern is optimal for UI development as it allows for a dynamic user experience. You can update your application in response to the events occurring within the ForgeRock Login Widget. For example, the ForgeRock Login Widget has events such as "loading", "completed", "success", and, "failure".

#### Assign an observable

You can create a variable and assign the observable to it:

```js
const userInfoEvents = user.info();
```

#### Subscribe to observable events

An observable is a stream of events over time. The ForgeRock Login Widget invokes the callback for each and every event from the observable, until you unsubscribe from it.

Use the `subscribe()` method on your variable to observe the event stream:

```js
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

For information on the events each observable returns, refer to the [API Reference](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/widget-api-reference.html).

#### Unsubscribe from an observable

Unlike a JavaScript promise, an observable does not resolve and then get cleaned up after completion.

You need to unsubscribe from an observable if it is no longer needed. This is especially important if you are subscribing to observables in a component that gets created and destroyed many times over. Subscribing to an observable over and over without unsubscribing creates a memory leak.

To unsubscribe, assign the function that is returned from calling the `subscribe()` method to a variable. Call this variable at a later time to unsubscribe from the observable.

```js
const unsubUserInfoEvents = userInfoEvents.subscribe((event) => console.log(event));

// ...

// Unsubscribe when no longer needed
unsubUserInfoEvents();
```

You do not need to unsubscribe from observables if you subscribe to observables in a top-level component of your app that is only initiated once, and is retained over the lifetime of your application.

A good location in which to subscribe to observables might be the central state management component or module of your application.

#### Get current local values

The ForgeRock Login Widget stores a number of important values internally.

You can get the current values stored within the ForgeRock Login Widget without subscribing to any future events or their resulting state changes by calling `subscribe()` and then immediately calling its unsubscribe method:

```js
// Create variable for user info
let userInfo;

// Call subscribe, get the current local value, and then immediately call the returned function
userInfoEvents.subscribe((event) => (userinfo = event.response))(); // <-- notice the second pair of parentheses
```

#### Get updated values from ForgeRock

You can ask the ForgeRock Login Widget to request new, fresh values from the ForgeRock server, rather than just what it has stored locally, by calling the observable action methods, such as `get`.

```js
userInfoEvents.get();
```

When using the observable pattern, you can call this method and forget about it. The `get` causes any `subscribe` callback functions you have for the observable to receive the events and new state.

The `subscribe` can exist before or after this `get` call and still capture the resulting events.

#### Use promises rather than observables

All of the Login Widget APIs that involve network calls have an alternative promise implementation that you can use.

For more information, refer to [Use promises rather than observables](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/07-subscribe.html#use_promises_rather_than_observables).

<!--------------------------------------------------------------------------------------------------------------->
<!-- DOCS -->

## Documentation

Documentation for the Login Widget is provided at [ForgeRock Backstage](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework.html), and includes topics such as:

- Instantiate the inline form factor
- Theme the widget
- API Reference
- Suspend journeys with "magic links"
- Log in with social authentication
- Log in with OATH one-time passwords

<!--------------------------------------------------------------------------------------------------------------->
<!-- SUPPORT -->

## Support

If you encounter any issues, be sure to check our **[Troubleshooting](https://backstage.forgerock.com/knowledge/kb/article/a68547609)** pages.

Support tickets can be raised whenever you need our assistance; here are some examples of when it is appropriate to open a ticket (but not limited to):

- Suspected bugs or problems with ForgeRock software.
- Requests for assistance - please look at the **[Documentation](https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework.html)** and **[Knowledge Base](https://backstage.forgerock.com/knowledge/kb/home/g32324668)** first.

You can raise a ticket using **[BackStage](https://backstage.forgerock.com/support/tickets)**, our customer support portal that provides one-stop access to ForgeRock services.

BackStage shows all currently open support tickets and allows you to raise a new one by clicking **New Ticket**.

<!--------------------------------------------------------------------------------------------------------------->
<!-- COLLABORATION -->

## Contributing

If you would like to contribute to this project you can fork the repository, clone it to your machine and get started.

<!-- Note: Found elsewhere, but is Java-only //-->

Be sure to check out our [Coding Style and Guidelines](https://wikis.forgerock.org/confluence/display/devcom/Coding+Style+and+Guidelines) page.

<!--------------------------------------------------------------------------------------------------------------->
<!-- LEGAL -->

## Disclaimer

> **This code is provided by ForgeRock on an “as is” basis, without warranty of any kind, to the fullest extent permitted by law.
> ForgeRock does not represent or warrant or make any guarantee regarding the use of this code or the accuracy,
> timeliness or completeness of any data or information relating to this code, and ForgeRock hereby disclaims all warranties whether express,
> or implied or statutory, including without limitation the implied warranties of merchantability, fitness for a particular purpose,
> and any warranty of non-infringement. ForgeRock shall not have any liability arising out of or related to any use,
> implementation or configuration of this code, including but not limited to use for any commercial purpose.
> Any action or suit relating to the use of the code may be brought only in the courts of a jurisdiction wherein
> ForgeRock resides or in which ForgeRock conducts its primary business, and under the laws of that jurisdiction excluding its conflict-of-law provisions.**

<!--------------------------------------------------------------------------------------------------------------->
<!-- LICENSE - Links to the MIT LICENSE file in each repo. -->

## License

This project is licensed under the MIT License - see the [LICENSE](package/LICENSE) file for details

---

&copy; Copyright 2022-2023 ForgeRock AS. All Rights Reserved

[forgerock-logo]: https://www.forgerock.com/themes/custom/forgerock/images/fr-logo-horz-color.svg 'ForgeRock Logo'
