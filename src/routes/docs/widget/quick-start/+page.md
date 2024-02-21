<script>
  // import Image from '../../image.svelte';

  // export let data;
</script>

# Quick Start

## Installing the package

Note: **This project is currently in Beta**, so importing the widget from npm requires the `beta` tag. Because of this, it's worth noting what's not [currently supported](#currently-unsupported).

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

## Using the Widget component

### Add element to your HTML file

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

### Instantiate the Widget

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

### The component lifecycle

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

Opening the modal by itself will just reveal the modal with a loading spinner. This is because the Widget has no data to inform it on what to render. [We will solve this in the "Starting a journey" section](#starting-a-journey).

In addition to being able to open the modal, you'll likely want to know when it's mounted, or closed by the user or upon completed authentication. This is done via the same API. A `subscribe` method will be on this `componentEvents` object (which technically makes this an observable), and all component related events will trigger the `subscribe` function to be called passing the `event` state to your callback function.

NOTE: For more information about Observables, [please see our section on this pattern and available alternatives](/docs/full-api#what-you-need-to-know).

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

### Configuring the Widget

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

### Starting a journey

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

### Getting a session

By default, the Widget is going to do more than just get a user's session. It will also get OAuth/OIDC tokens and retrieve user information. But, let's start small.

Let's only ask for session information, and disable OAuth and user info. This will simplify our initial setup. To do this, call the `journey` function passing false for `oauth` and `user`.

```js
const journeyEvents = journey({ oauth: false, user: false });
```

Now, when you call `journeyEvents.start()`, you will only get session information upon successful authentication.

NOTE: It's also worth nothing that if you don't declare what journey you want to use, the ForgeRock platform will use what is marked as the default journey, usually just the basic Login journey.

### Listening for journey completion

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

NOTE: For more information about Observables, [please see our section on this pattern and available alternatives](/docs/full-api#what-you-need-to-know).

And, that's it. You now can mount, display, and authenticate users through the ForgeRock Login Widget. There are addition features documented below for a more complete implementation.

## Want to inline the Widget into your app (no modal)?

The Widget requires a real DOM element on which to mount. Since the inline type will be mounted within your application's controlled DOM, it's important to understand the lifecycle of how your framework mounts elements to the DOM.

React, for example, uses the Virtual DOM, and the inline component cannot mount to a Virtual DOM element. So, you will need to wait until the element has been property mounted to the real DOM before instantiating the Widget.

### Instantiate the Widget (Inline)

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
