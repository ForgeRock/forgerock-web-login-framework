# Quick Start

Using the Login Widget within your JavaScript SPA.

## Installing the package

Note: **This project is currently in Beta**, so importing the widget from npm requires the `beta` tag. Because of this, it's worth noting what's not [currently supported](../roadmap/#currently-unsupported).

```shell
npm install @forgerock/login-widget@beta
```

## Adding the Widget's CSS

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
<!DOCTYPE html>
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

### Controlling the CSS cascade

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

## Using the Modal component

### Add element to your HTML file

We recommend you add a new element on which you will mount the Widget to your static HTML file. For most SPAs (Single Page Applications), this will be your `index.html`. This new element should be a direct child element of the body, and not without the element you mount your SPA.

Example:

```html
<!DOCTYPE html>
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

NOTE: We do not recommend injecting the element on which you will mount the widget within your main application. This can cause Virtual DOM issues, so manually adding it within your static HTML file is best.

### Instantiate the Widget (Modal)

Now, you can import the Widget into your app wherever you would like as a modal dialog (aka "lightbox"), or as an embedded component. Once the Widget is imported, you will need to instantiate it.

```js
// As modal dialog
import Widget from '@forgerock/login-widget/modal';

// ...

new Widget({
  target: document.getElementById('widget-root'), // Any existing element from static HTML file
  props: {
    config: {}, // Your JS SDK configuration; see below
  },
});
```

This mounts your Widget into the DOM. If you choose the modal version, it will be hidden at first.

Note: [See additional documentation about configuring the JS SDK](https://backstage.forgerock.com/docs/sdks/3.3/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html).

### Starting a journey (Modal)

The Widget will be mounted to the DOM, but it will not display the first step of the journey. To render the first step, you'll need to import the `journey` object and call the `journey.start` method. This makes the initial request to the ForgeRock server for the initial step.

```js
import Widget, { journey } from '@forgerock/login-widget/modal';

new Widget({
  target: document.getElementById('login-widget'), // Any existing element in the DOM
  props: {
    config: {}, // Your JS SDK configuration; see below
  },
});

// Be sure to call after instantiating the Widget
journey.start();

// OR, call on button click
buttonElement.addEventListener('click', (event) => {
  journey.start();
});
```

This `journey.start` method can be called anywhere in your application, or anytime as long as it's _after_ the Widget being mounted to the DOM.

### Listening for journey completion (Modal)

Use the `journey.onSuccess` method to know when a user has completed their journey. Pass a callback function into this method to run when the journey successfully completes.

```js
journey.onSuccess((response) => {
  console.log(response);
});
```

And, that's it. You now can mount, display, and authenticate users through the ForgeRock Login Widget. There are addition features documented below for a more complete implementation. For more about Widget events, [see the Widget Events section](#widget-events).

### Controlling the modal dialog

To show the modal, you will need to import the `modal` object, and use the `modal.open` method. It's common to execute this within a button's click handler.

```js
import Widget, { modal } from '@forgerock/login-widget/modal';

// ...

const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => {
  modal.open();
});
```

Opening the modal will display the Widget in a "Lightbox" or modal dialog and make a request to your ID Cloud (or AM) instance. When the Widget gets the response, it will display the required fields for authenticating the user. When the user successfully authenticates, the modal will close itself. If you'd like to close the widget programmatically, you can call the `modal.close` method.

## Using the Inline component

### Element for mounting

The Widget requires a real DOM element on which to mount. Since the Inline component will be mounted within your application's controlled DOM, it's important to understand the lifecycle of how your framework mounts elements to the DOM.

React, for example, uses the Virtual DOM, and the Inline component cannot mount to a Virtual DOM element. So, you will need to wait until the element has been property mounted to the real DOM before instantiating the Widget.

### Instantiate the Widget (Inline)

Now, import the Widget where you'd like to mount it. In whatever way your framework requires, provide a reference to the element mounted in the actual DOM as the target of the Widget instantiation.

```js
// As inline
import Widget from '@forgerock/login-widget/inline';

// ...

new Widget({
  target: mountedDomElement, // ensure this is a reference to a real DOM element
  props: {
    config: {}, // Your JS SDK configuration; see below
  },
});
```

This mounts your Widget into the DOM. If you choose the modal version, it will be hidden at first.

Note: [See additional documentation about configuring the JS SDK](https://backstage.forgerock.com/docs/sdks/3.3/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app.html).

### Starting a journey (Inline)

The Widget will be mounted to the DOM, but it will not display the first step of the journey. To render the first step, you'll need to import the `journey` object and call the `journey.start` method. This makes the initial request to the ForgeRock server for the initial step.

```js
import Widget, { journey } from '@forgerock/login-widget/inline';

// Call after instantiating the Widget
new Widget({
  target: actualDomElement, // ensure this is a reference to a real DOM element
  props: {
    config: {}, // Your JS SDK configuration; see below
  },
});
journey.start();

// OR, call on button click
buttonElement.addEventListener('click', (event) => {
  journey.start();
});
```

This `journey.start` method can be called anywhere in your application, or anytime as long as it's _after_ the Widget being mounted to the DOM.

### Listening for journey completion (Inline)

Use the `journey.onSuccess` method to know when a user has completed their journey. Pass a callback function into this method to run when the journey successfully completes.

```js
journey.onSuccess((response) => {
  console.log(response);
});
```

And, that's it. You now can mount, display, and authenticate users through the ForgeRock Login Widget. There are addition features documented within the [Full API section here](/docs/widget/full-api). For more about Widget events, [see the Widget Events section](/docs/widget/full-api#widget-events).

## Checking user information

There are many reasons why you may need user information throughout your application. It may be to display the user's first name or email, it may be to use tokens for protected resources, or to validate an Access Token with the ForgeRock server. Any of these will require the underlying SDK to be configured. To do this, you have two choices:

1. Configure the SDK through `Widget` instantiation
2. Configure the SDK through the `configuration` object

We've seen [configuring the SDK through `Widget` instantiation](#instantiate-the-widget-modal), but that may not always be preferable as the Widget may not be relevant in all parts of your app. Let's see how we can use the second option instead.

```js
let userInfo;

// Configure the underlying SDK, so it can communicate with the ForgeRock platform
configuration.set({
  clientId: 'WebOAuthClient',
  redirectUri: `${window.location.origin}/callback`,
  scope: 'openid profile email me.read',
  serverConfig: {
    baseUrl: 'https://example.forgeblocks.com/am/',
    timeout: 5000,
  },
  realmPath: 'alpha',
});

// Do we have stored tokens
if (await user.tokens()) {
  // User has tokens, so attempt call to /userinfo
  userInfo = await user.info(true);
} else {
  // If no tokens, assign null
  userInfo = null;
}
```
