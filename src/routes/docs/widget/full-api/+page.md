<script>
  import Image from '../../image.svelte';

  export let data;
</script>

# Complete Widget API

The Widget comes with methods and event handlers used to control the lifecycle of user journeys/authentication.

## Widget

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

## Configuration

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

## Journey

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

## Component

The named `component` import provides controls of the modal component.

```js
import { component } from 'forgerock-login-widget';

// Initiate the component API
const componentEvents = component();

// Know when the model has been mounted or closed to run your own logic
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

## User

As with almost all of our APIs, there's a choice between using Observables or Promises. We recommend Observables, but the choice is up to you. We will cover the Promise alternative in a different section.

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

## Request

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

## Styling Configuration

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
      height: '300px', // OPTIONAL; provides additional controls to logo display
      width: '400px', // OPTIONAL; provides additional controls to logo display
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

## Links Configuration

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

## Content Configuration

This configuration setting is for passing custom content to the Widget, replacing its default content. For the full content schema, please [use the example en-US locale file](/src/locales/us/en/index.ts).

Example:

```js
const config = configuration();

config.set({
  content: {}, // Custom content that overrides Widget default content
});
```
