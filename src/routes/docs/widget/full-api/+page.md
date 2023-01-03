# Complete Widget API

The Widget comes with methods and event handlers used to control the lifecycle of user journeys/authentication.

## Widget

```js
// As modal dialog
import Widget from 'forgerock-web-login-widget/modal';

// OR, as embedded
import Widget from 'forgerock-web-login-widget/inline';

// Instantiate Widget
const widget = new Widget({
  target: document.getElementById('widget-root'), // REQUIRED; Element available in DOM
  props: {
    /**
     * REQUIRED; SDK configuration object
     */
    config: {
      serverConfig: {
        baseUrl: 'https://customer.forgeblocks.com/am', // REQUIRED; URL to ForgeRock AM
      },

      /**
       * OPTIONAL, *BUT ENCOURAGED*, CONFIGURATION
       * Remaining config is optional with fallback values shown
       */
      clientId: 'WebLoginWidgetClient', // OPTIONAL; Uses 'WebLoginWidgetClient', if not provided
      realmPath: 'alpha', // OPTIONAL; Uses 'alpha', if not provided
      redirectUri: window.location.href, // OPTIONAL; falls back to `window.location.href`
      scope: 'openid email', // OPTIONAL; falls back to minimal 'openid email'
    },

    /**
     * OPTIONAL; See below for the content object schema [1]
     */
    content: {},

    /**
     * OPTIONAL; See below for the style object schema [2]
     */
    style: {},
  },
});

// OPTIONAL; Remove widget from DOM and destroy all listeners
widget.$destroy();
```

NOTE: For more SDK configuration options, please [see our SDK's configuration document](https://backstage.forgerock.com/docs/sdks/3.3/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html), or you can [see our API docs for more developer detail](https://backstage.forgerock.com/docs/sdks/3.3/_attachments/javascript/api-reference-core/interfaces/configoptions.html).

1. For content schema, please [use the example en-US locale file](/src/locales/us/en/index.ts)
2. For `style` schema and more information, please [see the Style section below](#styling-api)

## Journey

The `journey` object:

```js
import { journey } from 'forgerock-web-login-widget/modal';
// OR, import { journey } from 'forgerock-web-login-widget/inline';

// Call to start the journey
// Optional config can be passed in, see below for more details
journey.start();

// Listeners for journey events
// See below for more details on `response`
journey.onSuccess((response) => {
  /* Run anything you want */
});
journey.onFailure((error) => {
  /* Run anything you want */
});
```

NOTE: Optional `start` config:

```js
journey.start({
  config: undefined, // OPTIONAL; defaults to undefined, mechanism to override base SDK config object
  oauth: true, // OPTIONAL; defaults to true and uses OAuth flow for acquiring tokens
  resumeUrl: location.href, // OPTIONAL; full URL of app to continue journey from a "magic link"
  user: true, // OPTIONAL; default to true and returns user information from `userinfo` endpoint
});
```

NOTE: Schema for `response`

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

## User

The `user` object:

```js
import { user } from 'forgerock-web-login-widget/modal';
// OR, import { user } from 'forgerock-web-login-widget/inline';

// Is user currently authorized
await user.authorized(); // do they have OAuth tokens (local)?
await user.authorized({ remote: true }); // do we have valid tokens (remote)?

// Get user information
await user.info(); // what we have locally in-memory
await user.info({ remote: true }); // request user info from server

// Log user out
await user.logout();
```

## Request

The Widget has an alias to the JavaScript SDK's `HttpClient.request`, which is a convenience wrapper around the native `fetch`. All this does is auto-inject the Access Token into the `Authorization` header and manage some of the lifecycle around the token.

```js
import { request } from 'forgerock-web-login-widget/modal';
// OR, import { request } from 'forgerock-web-login-widget/inline';

// See below for more details on the options
request({ init: { method: 'GET' }, url: 'https://protected.resource.com' });
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

## Modal

The named `modal` import provides controls of the modal component.

```js
import { modal } from 'forgerock-web-login-widget/modal';

// Know when the modal auto-closes, not when the modal is
// The property `reason` will be either "auto", "external", or "user" (see below)
modal.onClose(({ reason }) => {
  /* Run anything you want */
});
// Know when the modal has mounted
modal.onMount((dialogElement, formElement) => {
  /* Run anything you want */
});

// "Open" the modal (this implicitly calls `journey.start()`)
// Optional config can be passed in, see below for more details
modal.open();

// "Close" the modal
modal.close();
```

It's worth noting that if the Widget has already mounted before the `onMount` statement, it will never run. It won't retroactively run the callback function.

`onClose` and the `reason` value:

1. `"user"`: user closed the dialog via UI
2. `"auto"`: the modal was closed because user successfully authenticated
3. `"external"`: the application itself called the `modal.close` function

NOTE: Optional `open` config (same optional config of `journey.start`):

```js
modal.open({
  config: undefined, // OPTIONAL; defaults to undefined, mechanism to override base SDK config object
  oauth: true, // OPTIONAL; defaults to true and uses OAuth flow for acquiring tokens
  resumeUrl: location.href, // OPTIONAL; full URL of app to continue journey from a "magic link"
  user: true, // OPTIONAL; default to true and returns user information from `userinfo` endpoint
});
```

## Inline

The named `form` import provides a simple `onMount` event.

```js
import { form } from 'forgerock-web-login-widget/inline';

// Know when the inline form has mounted
form.onMount((formElement) => {
  /* Run anything you want */
});
```

It's worth noting that if the Widget has already mounted before the `onMount` statement, it will never run. It won't retroactively run the callback function.

## Styling API

The Widget can be configured for styling purposes via the JavaScript API. This allows you to choose the type of labels used or providing a logo for the modal.

Example:

```js
const widget = new Widget({
  target: document.getElementById('widget-root'),
  props: {
    config: {
      /* ... */
    },
    content: {
      /* ... */
    },
    /**
     * OPTIONAL
     */
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
  },
});
```

Note that the `logo` and `section` property only apply to the "modal" form factor, and not the "inline".
