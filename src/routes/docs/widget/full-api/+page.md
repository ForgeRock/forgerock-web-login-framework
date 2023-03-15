<script>
  // import Image from '../../image.svelte';

  // export let data;
</script>

# Complete Widget APIs

## What you need to know

Most of this Widget's APIs are asynchronous. As with many things in the JavaScript world, there are multiple patterns to handle asynchronous behavior. We've decided to centralize the Widget's APIs around the event-centric, Observable pattern. Since this Widget is powered by Svelte's compiler, we use Svelte's simplified, but standard Observable implementation called a "store". You can [read more about the Svelte store contract in their docs](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract).

We believe this is an optimal pattern for UI development as it allows for a more dynamic, user experience. Your application will be updated with each event from emitted from within the Widget. These events could be "loading", "completed", "success" or "failure". To help illustrate this, let's take a look at one of the `user` APIs:

### Import the API object

We'll use the `user` module as an example, but most of the APIs you'll use will follow this pattern.

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
  } else if (event.successful) {
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

## Login Widget API in detail

Now that you have an idea of the general pattern of our APIs

### The `Widget` class

This is a compiled Svelte class. This is what instantiates the component, mounts it to the DOM and sets up all the event listeners.

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

### Configuration API

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

### Journey API

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

### Component API

The named `component` import provides methods for both listening (modal and inline type) as well as controlling (modal type only) the widget component. After initializing the component API via `component()`, you will receive an observable. Subscribing to this observable will allow you to listen and react to the state of the component.

```js
import { component } from 'forgerock-login-widget';

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

### User API

This API provides access to three main methods for user related management: `user.info`, `user.tokens` and `user.logout`. Please note that `user.info` requires the use of OAuth and an OAuth scope of `openid`. `user.tokens` just requires the use of OAuth. Both of these, by default, the Widget is configured to support.

The `user.logout` method can be used with OAuth based authentication or session based.

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

### Request API

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

### Styling Configuration Options

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

### Links Configuration Options

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

### Content Configuration Options

This configuration setting is for passing custom content to the Widget, replacing its default content. For the full content schema, please [use the example en-US locale file](/src/locales/us/en/index.ts).

Example:

```js
const config = configuration();

config.set({
  content: {}, // Custom content that overrides Widget default content
});
```
