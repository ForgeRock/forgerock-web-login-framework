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

1. `npm run install` (if not already)
2. `npm run build:widget`
3. `cd package`
4. `npm link` ([See here for more on `npm link`](https://docs.npmjs.com/cli/v8/commands/npm-link))
5. `cd` into the project you want to install the Widget
6. `npm link forgerock-web-login-widget`

Now, you can import the Widget into your app, and instantiate the component:

```js
import Widget from 'forgerock-web-login-widget';

// ...

new Widget({
  target: document.getElementById('login-widget'), // Any existing element in the DOM
  props: {
    config: {}, // Your JS SDK configuration; see below
  },
});
```

[See additional documentation about configuring the JS SDK](https://sdks.forgerock.com/javascript/configuring/configuring-forgerock-sdk-settings-for-your-javascript-app/).

This mounts your Widget into the DOM, but it will be hidden. To show the Widget, you will need to import the `modal` object, and use the `modal.open` function within an event handler:

```js
import Widget, { modal } from 'forgerock-web-login-widget';

// ...

const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => { modal.open() });
```

Opening the modal will display the Widget in a "Lightbox" or modal dialog and make a request to your ID Cloud (or AM) instance. When the Widget gets the response, it will display the required fields for authenticating the user. When the user successfully authenticates, the modal will close itself.

To be notified of this success, you'll need to import one more object and use a function to listen for the success:

```js
import Widget { modal, journey } from 'forgerock-web-login-widget';

// ...

journey.onSuccess((userInfo) => { console.log(userInfo) });
```

And, that's it. You now can mount, display, and authenticate users through the ForgeRock Login Widget. There are addition features documented below for a more complete implementation.

## Complete Widget API

```js
import Widget, { journey, modal, user } from 'forgerock-web-login-widget';

// ...

// Mount the widget to the DOM
new Widget({ target, config });

// Listeners for journey events
journey.onSuccess((userInfoObject) => { /* Run anything you want */ });
journey.onFailure((errorObject) => { /* Run anything you want */ });

// Programmatically control the modal
modal.open();
modal.close();

// Listen for modal on mount event
modal.onMount((modalDomElement) => { /* Run anything you want */ });

// Methods for user management
const isAuthorizedBoolean = await user.authorized();
const userInfoObject = await user.info();
await user.logout();
const userTokensObject = await user.tokens();
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
