<script>
  import Image from '../../image.svelte';
</script>

## Tutorials

Below are tutorials for popular Web frameworks/libraries, like React, Angular and Vue.

### Inline with React and Webpack

### Angular with Angular CLI

### Modal with Vue and Vite

### "Magic links" and journey continuation

Verifying a user's email address, building a "forgot password" flow, or using an email as a two-factor authentication method, ForgeRock's Email Suspend Node within journeys is the tool for the job. This results in the journey/tree being suspended until the user clicks a link (aka "magic link") found in their email. This link contains a randomly generated code that is used to continue the suspended journey.

Here's how to take advantage of this feature:

First, add the Email Suspend Node to the portion of the journey you'd like to suspend until the user continues the journey from the link found in their email.

<Image>

![Screenshot of Reset Password Journey](/img/reset-password-journey.png)

</Image>

Make sure to configure the External Login Page URL in the ForgeRock AM Console to your custom app's URL in order for the Reset Password email to redirect your app. By default, it will route to the ForgeRock login page.

<Image>

![Screenshot of Reset Password Journey](/img/external-login-page-url.png)

</Image>

When the Widget encounters the Email Suspend Node, it will render a string of text configured in the node, and the user will no longer be able to continue from that point until they visit their email.

When your app handles the request from this link, it needs to recognize this special condition and provide the Widget with the full URL that was used from the email.

```js
// Using the "modal" form factor
const url = new URL(location.href);
const suspendedId = url.searchParams.get('suspendedId');

if (suspendedId) {
  modal.open({ resumeUrl: location.href });
}

// Using the "inline" form factor
const url = new URL(location.href);
const suspendedId = url.searchParams.get('suspendedId');

if (suspendedId) {
  journey.start({ resumeUrl: location.href });
}
```

It's important that you pass the full URL and all query parameters from the magic link as the `resumeUrl`. Without all the parameters, the Widget may not be able to rehydrate the journey as needed.
