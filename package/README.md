# ForgeRock Web Login Framework

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release: conventional](https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Quick Start: Using the Widget in Your App](#quick-start-using-the-widget-in-your-app)
  - [Installing the package](#installing-the-package)
  - [Adding the Widget's CSS](#adding-the-widgets-css)
  - [Using the Widget component](#using-the-widget-component)
- [What you need to know](#what-you-need-to-know)
  - [Import the API Object](#import-the-api-object)
  - [Call API method to initiate observable](#call-api-method-to-initiate-observable)
  - [Use the subscribe method](#use-the-subscribe-method)
  - [Unsubscribing from an Observable](#unsubscribing-from-an-observable)
  - [Getting the current, local value](#getting-the-current-local-value)
  - [Requesting values from the ForgeRock platform](#requesting-values-from-the-forgerock-platform)
  - [User Promises](#using-promises)
- [Complete Widget API](#complete-widget-api)
  - [Widget](#widget)
  - [Configuration](#configuration)
  - [Journey](#journey)
  - [Component](#component)
  - [User](#user)
  - [Request](#request)
  - [Styling configuration](#styling-configuration)
  - [Links configuration](#links-configuration)
  - [Content configuration](#content-configuration)
- [Currently unsupported](#currently-unsupported)
- [Disclaimer](#disclaimer)
- [License](#license)

## Overview

The Login Widget produced by this framework is intended to be an all-inclusive, UI component that can be used within any modern JavaScript app for handling the default login, registration and related user flows. It can be used within a React, Vue, Angular or any other modern JavaScript framework (does not currently support Node.js or server-rendering (SSR)).

This Widget uses the ForgeRock JavaScript SDK internally. It adds a UI rendering layer on top of the SDK to help eliminate the need to develop and maintain the UI components necessary for providing complex authentication flows. Although this rendering layer is developed with Svelte and Tailwind, it is "compiled away" and has no runtime dependencies. It is library and framework agnostic.

This Widget can be rendered in two different types (or "form factors"):

1. **Modal** type: this is the default and the recommended way to use the widget at first. It renders the form elements inside a modal dialog that can be opened and closed. This component is mounted _outside_ of your app's controlled DOM.
2. **Inline** type: this is just the form elements themselves, no container. This component is intended to be rendered _inside_ your app's controlled DOM.

Both components provide the same authentication, OAuth/OIDC and user features. The only difference is how the component is rendered within your app.

It is highly recommended to start with the Modal form factor when in the experimenting or prototyping phase. It provides the quickest development experience for providing login and registration flows into your app with the least disruption to your existing codebase. The Modal will be controlled within your app, but rendered in its own DOM root node and visual layer.

## Requirements

1. A EcmaScript Module or CommonJS enable client-side JavaScript app
2. A "modern", fully-supported browser: Chrome, Firefox, Safari, Chromium Edge (see below for example of what's not supported)

What's not supported? Internet Explorer, Legacy Edge, WebView, Electron and other modified, browser-like environments are _not_ supported.

## Quick Start: Using the Widget in Your App

### Installing the package

```shell
npm install @forgerock/login-widget
```

### Adding the Widget's CSS

There are a few ways to add the Widget's CSS to your product:

1. Import it into your JavaScript project as a module
2. Import it using a CSS preprocessor, like Sass, Less or PostCSS
3. Copy the CSS file from the package and link it into your HTML

If you decide to import the CSS into your JavaScript, make sure your bundler knows how to import and process the CSS as a module. If using a CSS preprocessor, ensure you configure your preprocessor to access files from within your `package/` directory.

Copying the file and pasting it into your project for linking in the HTML is the easiest.

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

Linking CSS in HTML example (you may have to copy the CSS file out of the npm module and into your static files directory):

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <!-- ... -->
    <link rel="stylesheet" href="/path/to/file/widget.css" />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

#### Controlling the CSS cascade

Though not required, this helps solve common style issues that may pop up related to the CSS cascade. Using `@layer` will ensure the browser applies the CSS in the way you intend, regardless of the order you import or declare the CSS in your project. You can [read more about this new browser feature in the Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).

Steps recommended:

1. Wrap your current CSS in a layer called `app`:

   ```css
   @layer app {
     /* Your app's CSS */
   }
   ```

   Widget layers are already declared within the Widget's CSS.

2. Declare the order of layers in your index HTML file before any CSS is loaded:

   ```html
   <style type="text/css">
     @layer app;
     /* List the Widget layers last */
     @layer 'fr-widget.base';
     @layer 'fr-widget.utilities';
     @layer 'fr-widget.components';
     @layer 'fr-widget.variants';
   </style>
   ```

   It's important to note that none of the CSS imported for the Widget will overwrite any of your app's CSS. It's all namespaced to ensure there are no collisions. Unless, that is, you use the exact same selector naming convention we use.

### Using the Widget component

#### Add element to your HTML file

We recommend you add a new element on which you will mount the Widget to your static HTML file. For most SPAs (Single Page Applications), this will be your `index.html`. This new element should be a direct child element of the body, and not without the element you mount your SPA.

Example:

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

NOTE: We do not recommend mounting the Widget on a dynamic element that's inside your main application's "controlled DOM". If you're not experienced with mixed rendering types in the Virtual DOM, you may find this challenging at first. So, to ensure success at the start, manually adding it outside of your application's controlled DOM is best. It's recommended to put the element for Widget mounting in your static HTML file as a child of the `<body>` tag.

#### Instantiate the Widget

You can import the Widget into your app wherever you would like as a modal dialog (aka "lightbox"), this form factor is the default. Once the Widget is imported, you will need to instantiate it.

```js
// As modal dialog
import Widget from '@forgerock/login-widget';

// ...

// Grab the root element added to your HTML file
const widgetRootEl = document.getElementById('widget-root');

// Instantiate Widget with the `new` keyword
new Widget({
  target: widgetRootEl, // Any existing element from static HTML file
});
```

This instantiates the component and mounts the Widget into the DOM. By default, it will be the Modal version, and will therefore be be hidden at first. Component controls will be discussed shortly.

Note: [See additional documentation about configuring the JS SDK](https://backstage.forgerock.com/docs/sdks/3.3/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html).

#### The component lifecycle

When using the default Modal form factor, the first thing you'll want to do is open it. To do this, you need to import the `component` function. Executing this function will return a `componentEvents` object, you can name this whatever you'd like. Calling the `componentEvents.open` method will trigger the modal to animate into view.

```js
import Widget, { component } from '@forgerock/login-widget';

// ...

const componentEvents = component();

new Widget({ target: widgetRootEl }); // Instantiate the Widget

componentEvents.open(); // Ensure this is called after the Widget has been instantiated

// A more realistic pattern is calling this within a button click
const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => {
  componentEvents.open();
});
```

NOTE: Opening the modal by itself will just reveal the modal with a loading spinner. This is because the Widget has no data to inform it on what to render. We will solve this in the "Starting a journey" section.

In addition to being able to open the modal, you'll likely want to know when it's mounted, or closed by the user or upon completed authentication. This is done via the same API. A `subscribe` method will be on this `componentEvents` object (which technically makes this an observable), and all component related events will trigger the `subscribe` function to be called passing the `event` state to your callback function.

```js
componentEvents.subscribe((event) => {
  if (event.mounted) {
    console.log('Widget is mounted!');
  }
});
```

When the user successfully authenticates, the modal will close itself and emit an event. You can detect this within your `subscribe` callback function and the `event` object.

```js
componentEvents.subscribe((event) => {
  if (event.mounted) {
    console.log('Widget is mounted!');
  }

  if (event.open === false) {
    console.log(event.reason); // The reason for closing will be provided
  }
});
```

If you'd like to close the modal programmatically, you can via the `componentEvents.close` method.

#### Configuring the Widget

Before the Widget can interact with the ForgeRock platform, it will need to be configured. We have a `configuration` function for this API.

First, import the `configuration` function from the module and call it to receive the config API. This API has a single method called `set`. Let's start with the minimal configuration.

```js
import { configuration } from '@forgerock/login-widget';

const config = configuration();
config.set({
  forgerock: {
    serverConfig: {
      baseUrl: 'https://example.forgeblocks.com/am/', // This needs to be your AM URL
      timeout: 3000, // In milliseconds; 3 to 5 seconds should be fine
    },
  },
});
```

NOTE: It's best to configure the Widget at the top level of your application, like its `index.js` or `app.js` file. This will ensure the Widget has the configuration needed to call out to the ForgeRock platform whenever you use the other Widget APIs.

#### Starting a journey

For the Widget to display the appropriate form fields, a request needs to be made to ForgeRock for the first step of the journey. To render the first step, you'll need to import the `journey` function and execute it to receive the `journeyEvents` object (you'll notice this is a pattern throughout the Widget API). Once you have this `journeyEvents` object, you can call the `journeyEvents.start` method. Calling `start` makes the initial request to the ForgeRock server for the initial form fields.

```js
import Widget, { journey } from '@forgerock/login-widget';

const journeyEvents = journey();

// ...

new Widget({
  target: widgetRootEl, // Any existing element in the DOM
});

// Ensure you call `.start` *AFTER* instantiating the Widget
journeyEvents.start();

// OR, in a more typical situation, call on button click
buttonElement.addEventListener('click', (event) => {
  journeyEvents.start();
});
```

NOTE: This `journeyEvents.start` method can be called anywhere in your application, or anytime, as long as it's _after_ calling the configuration's `set` method and _after_ instantiating the Widget (which mounts it to the DOM) as both are requirements for a journey.

#### Getting a session

By default, the Widget is going to do more than just get a user's session. It will also get OAuth/OIDC tokens and retrieve user information. But, let's start small.

Let's only ask for session information, and disable OAuth and user info. This will simplify our initial setup. To do this, call the `journey` function passing false for `oauth` and `user`.

```js
const journeyEvents = journey({ oauth: false, user: false });
```

Now, when you call `journeyEvents.start()`, you will only get session information upon successful authentication.

NOTE: It's also worth nothing that if you don't declare what journey you want to use, the ForgeRock platform will use what is marked as the default journey, usually just the basic Login journey.

#### Listening for journey completion

Use the `journeyEvents.subscribe` method (this is the observable part) to know when a user has completed their journey. Pass a callback function into this method to run on journey related events (there will be a quite a few of them). You will receive an event object with a lot of data in it. You'll want to conditionally check for the events you're interested in and ignore what you don't need.

```js
// ...

journeyEvents.subscribe((event) => {
  // Will be called multiple times, so narrowing what you're interested in is important
  if (event.journey.successful) {
    // Will log once to the console when authentication has succeeded and returned session data
    console.log(event);
  }
});
```

And, that's it. You now can mount, display, and authenticate users through the ForgeRock Login Widget. There are addition features documented below for a more complete implementation.

### Want to inline the Widget into your app (no modal)?

The Widget requires a real DOM element on which to mount. Since the inline type will be mounted within your application's controlled DOM, it's important to understand the lifecycle of how your framework mounts elements to the DOM.

React, for example, uses the Virtual DOM, and the inline component cannot mount to a Virtual DOM element. So, you will need to wait until the element has been property mounted to the real DOM before instantiating the Widget.

#### Instantiate the Widget (Inline)

Now, import the Widget where you'd like to mount it. In whatever way your framework requires, provide a reference to the element mounted in the actual DOM as the target of the Widget instantiation.

```js
// As inline
import Widget from '@forgerock/login-widget';

// ...

new Widget({
  target: mountedDomElement, // ensure this is a reference to a real DOM element
  props: {
    type: 'inline', // Your JS SDK configuration; see below
  },
});
```

This mounts your Widget into the DOM. If you choose the modal version, it will be hidden at first.

Note: [See additional documentation about configuring the JS SDK](https://backstage.forgerock.com/docs/sdks/3.3/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html).

## What you need to know

Most of this Widget's APIs are asynchronous. As with many things in the JavaScript world, there are multiple patterns to handle asynchronous behavior. We've decided to centralize the Widget's APIs around the event-centric, Observable pattern. Since this Widget is powered by Svelte's compiler, we use Svelte's simplified, but standard Observable implementation called a "store". You can [read more about the Svelte store contract in their docs](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract).

We believe this is an optimal pattern for UI development as it allows for a more dynamic, user experience. Your application will be updated with each event from emitted from within the Widget. These events could be "loading", "completed", "success" or "failure". To help illustrate this, let's take a look at one of the `user` APIs:

### Import the API object

```js
import { user } from '@forgerock/login-widget';
```

### Call API method to initiate observable

Create a variable and assign the created observable:

```js
const userInfoEvents = user.info();
```

### Use the subscribe method

It's important to note that an observable is a "stream" of events over time. This means that the callback function in a subscribe will be called for each and every event until you unsubscribe from it (more on this later).

```js
userInfoEvents.subscribe((event) => {
  if (event.loading) {
    console.log('User info is being requested from server');
  } else if (event.success) {
    console.log('User info request was successful');
    console.log(event.response);
  } else if (event.error) {
    console.error('User info request failed');
    console.error(event.error.message);
  }
});
```

### Unsubscribing from an Observable

Observables are not like a Promise in that Observables don't resolve and get "torn-down" after completion. Observables need to be unsubscribed from if they are no longer needed. This is especially important if you are subscribing to Observables in a component that gets created and destroyed many times over. Subscribing to an Observable over and over without unsubscribing will create a memory leak.

To unsubscribe, you assign a function that is returned from calling the subscribe method to a variable that can be called at a later time.

```js
const unsubUserInfoEvents = userInfoEvents.subscribe((event) => console.log(event));

// ...

// Unsubscribe when no longer needed
unsubUserInfoEvents();
```

NOTE: If you're subscribing at a top-level component in your app that's initiated once and is retained over the lifetime of your application, then unsubscribing is not needed. A good example of this would be your app's central, state management component/module. This is a perfect place to `subscribe` to an Observable and preserve that subscription.

### Getting the current, local value

Sometimes you just want the current value stored within the Widget and are not interested in future events and their resulting state changes. To do this, you can call `subscribe` and then immediately call the unsubscribe method.

```js
// Create variable for user info
let userInfo;
// Call subscribe, grab the current, local value, and then immediately call the returned function
userInfoEvents.subscribe((event) => (userinfo = event.response))(); // <-- notice the second pair of parentheses
```

What does "current, local value" mean? Good question. The Widget internally stores a lot of these important values, so you can ask the Widget for the values that it already has stored.

### Requesting values from the ForgeRock platform

You can ask the Widget to request new, fresh values from the ForgeRock server, rather than just what it has stored locally. This is done by calling the Observables action methods, like `get`.

```js
userInfoEvents.get();
```

If you're using the Observable pattern, you can call this method and forget about it. The `subscribe` callback function you have for this Observable will receive the events and new state from this `get` call. The `subscribe` can exist before or after this `get` call, and it will still capture the resulting events.

### Using Promises

We recommend Observables, but the choice is up to you. All of the Widget's APIs that involve network calls have an alternative Promise implementation that can be used. Let's take the `get` method on `userInfoEvents` we saw above as a way to fetch new user info, and convert it into a Promise.

```js
// async-await
let userInfo;
async function example() {
  try {
    userInfo = await userInfoEvents.get();
  } catch (err) {
    console.log(err);
  }
}

// Promise
let userInfo;
userInfoEvents
  .get()
  .then((data) => (userInfo = data))
  .catch((err) => console.log(err));
```

## Complete Widget API

The Widget comes with methods and event handlers used to control the lifecycle of user journeys/authentication.

### Widget

```js
import Widget from '@forgerock/login-widget';

// Instantiate Widget
const widget = new Widget({
  target: widgetRootEl, // REQUIRED; Element mounted in DOM
  props: {
    type: 'modal', // OPTIONAL; "modal" or "inline"; "modal" is default
  },
});

// OPTIONAL; Remove widget from DOM and destroy component listeners
widget.$destroy();
```

NOTE: Calling `$destroy()` is important if the instantiation of the Widget is done within a portion of your application that is frequently created and destroyed. Though, we _strongly_ encourage developers to instantiate the Widget higher up in the application code closer to the top-level file, in a component that is created once and preserved.

### Configuration

This configuration function produces a config API, and its `set` method is required for the underlying JavaScript SDK to interaction with the ForgeRock platform or access stored tokens.

```js
import { configuration } from '@forgerock/login-widget';

const config = configuration();
config.set({
  forgerock: {
    /**
     * REQUIRED; SDK configuration object
     */
    serverConfig: {
      baseUrl: 'https://customer.forgeblocks.com/am',
      timeout: 3000, // Number (in milliseconds); 3 to 5 seconds should be fine
    },
    /**
     * OPTIONAL, *BUT ENCOURAGED*, CONFIGURATION
     * Remaining config is optional with fallback values shown
     */
    clientId: 'WebLoginWidgetClient', // String; defaults to 'WebLoginWidgetClient'
    realmPath: 'alpha', // String; defaults to 'alpha'
    redirectUri: window.location.href, // URL string; defaults to `window.location.href`
    scope: 'openid email', // String; defaults to 'openid email'
    /**
     * NOT RECOMMENDED
     * Rather, configure a journey/tree through the `.start({ journey: 'Login' })` options object,
     * avoid setting it here
     */
    tree: 'Login', // String, but NOT recommended.
  },
  /**
   * OPTIONAL; See below for the Content Configuration section
   */
  content: {},
  /**
   * OPTIONAL; See below for the Links Configuration section
   */
  links: {},
  /**
   * OPTIONAL; See below for Styling Configuration section
   */
  style: {},
});
```

NOTE: For more SDK configuration options, please [see our SDK's configuration document](https://backstage.forgerock.com/docs/sdks/3.3/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html), or you can [see our API docs for more developer detail](https://backstage.forgerock.com/docs/sdks/3.3/_attachments/javascript/api-reference-core/interfaces/configoptions.html).

### Journey

The `journey` object:

```js
import { journey } from '@forgerock/login-widget';

// Call to start the journey
// Optional config can be passed in, see below for more details
const journeyEvents = journey({
  oauth: true, // OPTIONAL; defaults to true; uses OAuth flow for acquiring tokens
  user: true, // OPTIONAL; default to true; returns user information from `userinfo` endpoint
});

// Start a journey
journeyEvents.start({
  forgerock: {}, // OPTIONAL; configuration overrides
  journey: 'Login', // OPTIONAL; choice the journey or tree you want to start
  resumeUrl: window.location.href, // OPTIONAL; the full URL for resuming a tree (see resuming a journey section)
});

// Change a journey
journeyEvents.change({
  forgerock: {}, // OPTIONAL; configuration overrides
  journey: 'Registration', // OPTIONAL; choice the journey or tree you want to start
});

// Listeners for journey events
// See below for more details on `event`
journey.subscribe((event) => {
  /* Run anything you want */
});
```

Schema for user `event`:

```js
// response
{
  journey: {
    completed: false, // boolean
    error: null, // null or object with `code`, `message` and `step` that failed
    loading: false, // boolean
    step: null, // null or object with the last step object from ForgeRock AM
    successful: false, // boolean
    response: null, // null or object, if successful, it will contain the success response from AM
  },
  oauth: {
    completed: false, // boolean
    error: null, // null or object with `code` and `message` properties
    loading: false, // boolean
    successful: false, // boolean
    response: null, // null or object with OAuth/OIDC tokens
  },
  user: {
    completed: false, // boolean
    error: null, // null or object with `code` and `message` properties
    loading: false, // boolean
    successful: false, // boolean
    response: null, // null or object with user information driven by OAuth scope config
  },
}
```

### Component

The named `component` import provides methods for both listening (modal and inline type) as well as controlling (modal type only) the widget component. After initializing the component API via `component()`, you will receive an observable. Subscribing to this observable will allow you to listen and react to the state of the component.

```js
import { component } from '@forgerock/login-widget';

// Initiate the component API
const componentEvents = component();

// Know when the component, both modal and inline has been mounted.
// When using the modal type, you will also receive open and close events.
// The property `reason` will be either "auto", "external", or "user" (see below)
componentEvents.subscribe((event) => {
  /* Run anything you want */
});

// Open the modal
componentEvents.open();

// Close the modal
componentEvents.close();
```

Schema for component `event`:

```js
{
  error: null, // null or object with `code`, `message` and `step` that failed
  mounted: false, // boolean
  open: null, // boolean or null, depending on the Widget type: e.g. "modal" or "inline"
  reason: null, // string to describe the reason for the event
  type: null, // 'modal' or 'inline'
}
```

The `reason` value is used for communicating why the modal has closed. The below are the potential values:

1. `"user"`: user closed the dialog via UI
2. `"auto"`: the modal was closed because user successfully authenticated
3. `"external"`: the application itself called the `modal.close` function

### User

```js
import { user } from '@forgerock/login-widget';

/**
 * User info API
 */
const userEvents = user.info();
// Subscribe to user info changes
userEvents.subscribe((event) => {
  // Will return current, *local*, user info and future state changes
  console.log(event);
});
// Fetch/get fresh user info from ForgeRock server
userEvents.get(); // New state will be returned in your `userEvents.subscribe` callback function

/**
 * User tokens API
 */
const tokenEvents = user.tokens();
// Subscribe to user info changes
tokenEvents.subscribe((event) => {
  // Will return current, *local*, user tokens and future state changes
  console.log(event);
});
// Fetch/get fresh user tokens from ForgeRock server
tokenEvents.get(); // New state will be returned in your tokenEvents.subscribe` callback function

/**
 * Logout
 * Log user out and clear user data (info and tokens)
 */
user.logout(); // Resets user and emits event to your info and tokens' `.subscribe` callback function
```

Schema for user info `event`:

```js
{
  completed: false, // boolean
  error: null,  // null or object with `code`, `message` and `step` that failed
  loading: false, // boolean
  successful: false, // boolean
  response: null, // object returned from the `/userinfo` endpoint configured in ForgeRock
}
```

Schema for token `event`:

```js
{
  completed: false, // boolean
  error: null,  // null or object with `code`, `message` and `step` that failed
  loading: false, // boolean
  successful: false, // boolean
  response: null, // object returned from the `/access_token` endpoint configured in ForgeRock
}
```

### Request

The Widget has an alias to the JavaScript SDK's `HttpClient.request`, which is a convenience wrapper around the native `fetch`. All this does is auto-inject the Access Token into the `Authorization` header and manage some of the lifecycle around the token.

NOTE: This request function is just a wrapper around the native `fetch` API. It's purely promise based and the [response object is the native `Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). The response is not persisted locally within the Widget.

```js
import Widget from '@forgerock/login-widget';

// See below for more details on the options
const response = await request({ init: { method: 'GET' }, url: 'https://protected.resource.com' });
```

The full `options` object:

```js
{
  bypassAuthentication: false, // Boolean; if true, Access Token is not injected into Authorization header
  init: {
    // Options object for `fetch` API: https://developer.mozilla.org/en-US/docs/Web/API/fetch
  },
  timeout: 3000, // Fetch timeout in milliseconds
  url: 'https://protected.resource.com', // String; the URL of the resource

  // Unsupported properties
  authorization: {},
  requiresNewToken: () => {},
}
```

For the full type definition of this, please [view our SDK API documentation](https://backstage.forgerock.com/docs/sdks/3.3/_attachments/javascript/api-reference-core/interfaces/httpclientrequestoptions.html).

### Styling Configuration

The Widget can be configured for styling purposes via the JavaScript API. This allows you to choose the type of labels used or providing a logo for the modal.

Example:

```js
const config = configuration();

config.set({
  style: {
    checksAndRadios: 'animated', // OPTIONAL; choices are 'animated' or 'standard'
    labels: 'floating', // OPTIONAL; choices are 'floating' or 'stacked'
    logo: {
      // OPTIONAL; only used with modal form factor
      dark: 'https://example.com/img/white-logo.png', // OPTIONAL; used if theme has a dark variant
      light: 'https://example.com/img/black-logo.png', // REQUIRED if logo property is provided; full URL
      height: 300, // OPTIONAL; number of pixels for providing additional controls to logo display
      width: 400, // OPTIONAL; number of pixels for providing additional controls to logo display
    },
    sections: {
      // OPTIONAL; only used with modal form factor
      header: false, // OPTIONAL; uses a modal "header" section that displays logo
    },
    stage: {
      icon: true, // OPTIONAL; displays generic icons for the provided stages
    },
  },
});
```

Note that the `logo` and `section` property only apply to the "modal" form factor, and not the "inline".

### Links Configuration

Use this configuration option to set the URL for your site or app's Terms & Conditions page. This supports the the `TermsAndConditionsCallback` that's commonly found in a registration flow.

Example:

```js
const config = configuration();

config.set({
  links: {
    termsAndConditions: 'https://example.com/terms', // Full canonical URL for your app's terms and conditions page
  },
});
```

### Content Configuration

This configuration setting is for passing custom content to the Widget, replacing its default content. For the full content schema, please [use the example en-US locale file](/src/locales/us/en/index.ts).

Example:

```js
const config = configuration();

config.set({
  content: {}, // Custom content that overrides Widget default content
});
```

## Future Support (not yet implemented)

### Planned for a future, minor release

1. WebAuthn
2. Device Profile

### Planned for a future, major release

1. Push Authentication
2. ReCAPTCHA
3. QR Code display
4. TextOutputCallback with scripts
5. Central Login
6. SAML
7. NumberAttributeInputCallback

## Disclaimer

> **This code is provided by ForgeRock on an “as is” basis, without warranty of any kind, to the fullest extent permitted by law. ForgeRock does not represent or warrant or make any guarantee regarding the use of this code or the accuracy, timeliness or completeness of any data or information relating to this code, and ForgeRock hereby disclaims all warranties whether express, or implied or statutory, including without limitation the implied warranties of merchantability, fitness for a particular purpose, and any warranty of non-infringement. ForgeRock shall not have any liability arising out of or related to any use, implementation or configuration of this code, including but not limited to use for any commercial purpose. Any action or suit relating to the use of the code may be brought only in the courts of a jurisdiction wherein ForgeRock resides or in which ForgeRock conducts its primary business, and under the laws of that jurisdiction excluding its conflict-of-law provisions.**

<!---------------------------------------------------------------------------------------------------------->
<!-- LICENSE - Links to the MIT LICENSE file in each repo. -->

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

&copy; Copyright 2022-2023 ForgeRock AS. All Rights Reserved.

[forgerock-logo]: https://www.forgerock.com/themes/custom/forgerock/images/fr-logo-horz-color.svg 'ForgeRock Logo'
