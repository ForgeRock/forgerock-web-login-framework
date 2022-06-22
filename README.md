# ForgeRock Web Login Framework

## Warning: Vaporware

**This is a prototype of a development framework for integrating a ForgeRock Login Widget into an existing app, or running as a standalone Login App. This project is not officially supported and is not recommended for any project development. If you use this, you accept all the risks that come with unsupported software.**

## Technical Requirements

1. Node.js v16 or higher
2. npm v8 or higher

## Knowledge Requirements

1. JavaScript & TypeScript
2. Svelte
3. ES Modules

## Quick Start: Local Development

1. `npm run install` (or simply `npm i`)
2. `npm run build`
3. `npm run dev` (leave running)

This will install all the necessary dependencies, build the project and run it in `dev` mode, providing you with Hot Module Reloading. This will also produce the Widget package for use in external applications.

## Quick Start: Using the Widget in Your App

Note: This project is currently in Alpha, so this is not available via npm.

1. `npm run install` (if not already)
2. `npm run build:widget`
3. `cd package`
4. `npm link` ([See here for more on `npm link`](https://docs.npmjs.com/cli/v8/commands/npm-link))
5. `cd` into the project you want to install the Widget
6. `npm link forgerock-web-login-widget`

Now, you can import the Widget into your app as a modal dialog (aka "lightbox"), or as an embedded component. Once the Widget is imported, you will need to instantiate it.

```js
// As modal dialog
import Widget from 'forgerock-web-login-widget/modal';

// OR, as embedded
import Widget from 'forgerock-web-login-widget/inline';

// ...

new Widget({
  target: document.getElementById('login-widget'), // Any existing element in the DOM
  props: {
    config: {}, // Your JS SDK configuration; see below
  },
});
```

This mounts your Widget into the DOM. If you choose the modal version, it will be hidden at first.

Note: [See additional documentation about configuring the JS SDK](https://sdks.forgerock.com/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app/).

### Controlling the modal dialog

To show the modal, you will need to import the `modal` object, and use the `modal.open` method. It's common to execute this within a button's click handler.

```js
import Widget, { modal } from 'forgerock-web-login-widget/modal';

// ...

const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => { modal.open() });
```

Opening the modal will display the Widget in a "Lightbox" or modal dialog and make a request to your ID Cloud (or AM) instance. When the Widget gets the response, it will display the required fields for authenticating the user. When the user successfully authenticates, the modal will close itself. If you'd like to close the widget programmatically, you can call the `modal.close` method.

## Widget Events

To be notified of a successful authentication, you'll need to import another object and use a function to listen for the success and failure event:

```js
import Widget { modal, journey } from 'forgerock-web-login-widget/modal';

// ...

journey.onSuccess((userData) => { console.log(userData) });
journey.onFailure((error) => { console.log(error) });
```

And, that's it. You now can mount, display, and authenticate users through the ForgeRock Login Widget. There are addition features documented below for a more complete implementation.

## Complete Widget API: Modal

### Recommended: "singleton" methods to modal controls and form events

This is the recommended method for controlling your widget. If you have multiple instances of the Widget within your DOM, you'll need to use the "instance" methods listed below.

```js
// Import Widget and additional "singletons" for modal and user management
import Widget, { journey, modal, user } from 'forgerock-web-login-widget/modal';

// ...

// Mount the widget to the DOM
const loginWidget = new Widget({ target, config });

// Listeners for journey events
journey.onSuccess((userDataObject) => { /* Run anything you want */ });
journey.onFailure((errorObject) => { /* Run anything you want */ });

// Programmatically control the modal
modal.open();
modal.close();

// Methods for user management
const isAuthorizedBoolean = await user.authorized();
const userInfoObject = await user.info();
await user.logout();
const userTokensObject = await user.tokens();

// Destroy widget when no longer needed
loginWidget.$destroy();
```

### Using the alternative, modal "instance" methods

If you have more than one instance of the Widget within your DOM, you'll need to use the instance methods in order to control the right one.

```js
// Import Widget and one user "singleton" for managing user
import Widget, { user } from 'forgerock-web-login-widget/modal';

// ...

// Mount the widget to the DOM
const loginWidget = new Widget({ target, config });

// Listeners for journey events
loginWidget.$on('journey-success', (userDataObject) => { /* Run anything you want */ };
loginWidget.$on('journey-failure', (errorObject) => { /* Run anything you want */ };

// Programmatically control the modal
loginWidget.$set({ open: true });
loginWidget.$set({ open: false });

// Listen for modal on mount event
loginWidget.$on('modal-mount', (modalDomElement) => { /* Run anything you want */ };

// Methods for user management
const isAuthorizedBoolean = await user.authorized();
const userInfoObject = await user.info();
await user.logout();
const userTokensObject = await user.tokens();

// Destroy widget when no longer needed
loginWidget.$destroy();
```

### User Data Object

```ts
interface UserData {
  info: {
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    sub: string;
  };
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
}
```

## Complete Widget API: Inline

### Recommended: "singleton" methods to form events and controls

This is the recommended method for controlling your widget. If you have multiple instances of the Widget within your DOM, you'll need to use the "instance" methods listed below.

```js
// Import Widget and additional "singletons" for modal and user management
import Widget, { form, journey, user } from 'forgerock-web-login-widget/inline';

// ...

// Mount the widget to the DOM
const loginWidget = new Widget({ target, config });

// Listeners for journey events
journey.onSuccess((userDataObject) => { /* Run anything you want */ });
journey.onFailure((errorObject) => { /* Run anything you want */ });

// Methods for user management
const isAuthorizedBoolean = await user.authorized();
const userInfoObject = await user.info();
await user.logout();
const userTokensObject = await user.tokens();

// Destroy widget when no longer needed
loginWidget.$destroy();
```

### Using the alternative, form "instance" methods

If you have more than one instance of the Widget within your DOM, you'll need to use the instance methods in order to control the right one.

```js
// Import Widget and one user "singleton" for managing user
import Widget, { user } from 'forgerock-web-login-widget/inline';

// ...

// Mount the widget to the DOM
const loginWidget = new Widget({ target, config });

// Listeners for journey events
loginWidget.$on('journey-success', (userDataObject) => { /* Run anything you want */ };
loginWidget.$on('journey-failure', (errorObject) => { /* Run anything you want */ };

// Methods for user management
const isAuthorizedBoolean = await user.authorized();
const userInfoObject = await user.info();
await user.logout();
const userTokensObject = await user.tokens();

// Destroy widget when no longer needed
loginWidget.$destroy();
```

### User Data Object

```ts
interface UserData {
  info: {
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    sub: string;
  };
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
}
```

## Accessing the Underlying SDK

If you need access to the JavaScript SDK for lower-level functionality, you can import it like this:

```js
import SDK from `forgerock-web-login-widget/sdk`;
```

## Disclaimer

> **This code is provided by ForgeRock on an “as is” basis, without warranty of any kind, to the fullest extent permitted by law. ForgeRock does not represent or warrant or make any guarantee regarding the use of this code or the accuracy, timeliness or completeness of any data or information relating to this code, and ForgeRock hereby disclaims all warranties whether express, or implied or statutory, including without limitation the implied warranties of merchantability, fitness for a particular purpose, and any warranty of non-infringement. ForgeRock shall not have any liability arising out of or related to any use, implementation or configuration of this code, including but not limited to use for any commercial purpose. Any action or suit relating to the use of the code may be brought only in the courts of a jurisdiction wherein ForgeRock resides or in which ForgeRock conducts its primary business, and under the laws of that jurisdiction excluding its conflict-of-law provisions.**

<!---------------------------------------------------------------------------------------------------------->
<!-- LICENSE - Links to the MIT LICENSE file in each repo. -->

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

&copy; Copyright 2020 ForgeRock AS. All Rights Reserved.

[forgerock-logo]: https://www.forgerock.com/themes/custom/forgerock/images/fr-logo-horz-color.svg 'ForgeRock Logo'
