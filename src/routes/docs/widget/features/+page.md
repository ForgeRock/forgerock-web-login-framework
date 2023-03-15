<script>
  import Image from '../../image.svelte';

  // export let data;
</script>

# Supported Features

## Email suspend and "Magic links"

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
import { journey } from '@forgerock/login-widget';

const journeyEvents = journey();

const url = new URL(location.href);
const suspendedId = url.searchParams.get('suspendedId');

if (suspendedId) {
  journey.start({ resumeUrl: location.href });
}
```

It's important that you pass the full URL and all query parameters from the magic link as the `resumeUrl`. Without all the parameters, the Widget may not be able to rehydrate the journey as needed.

## Social authentication with Apple, Facebook and Google

Social Authentication provides your users with a choice of ways to sign in that suit them. Using the three identity providers that are supported by the ForgeRock JS SDK, users can select their preferred provider which will initiate an OAuth2.0 flow allowing them to authenticate themselves with the social provider, before returning to their original journey. Apple, Facebook and Google are supported Identity Providers and this feature can be built into Login or Registration journeys.

To enable this flow you will need to:

- Firstly to offer your users a choice of social identity providers using the Select IDP node. You can optionally allow the user to instead skip social authentication and enter their credentials on the same form, provided that nodes such as a username collector are also present. It is also recommended to filter the social providers that are offered, so only the most relevant ones to your user are shown.
- Initiate the OAuth2.0 flow for your user using the Social Provider Handler Node
- Finally, determine if the user signed in to the social provider maps to a user known to ForgeRock, using the Identify Existing User Node.

<Image>

![Screenshot of Social Login Journey](/img/social-login-journey.png)

</Image>

A detailed guide covering the creation of Social Authentication journeys can be found in the How-To article on Backstage: [How do I create end user journeys for social registration and login in Identity Cloud?](https://backstage.forgerock.com/knowledge/kb/article/a80828410)

Using the Login Widget, the selection of social identity provider and redirection to initiate the flow will be taken care of, but your app needs to handle the return after redirection back from the provider, by detecting code, state and form_post_entry query parameters to instruct the widget to resume authentication using the current URL:

```js
import { journey } from '@forgerock/login-widget';

const journeyEvents = journey();

const url = new URL(location.href);
const codeParam = url.searchParams.get('code');
const stateParam = url.searchParams.get('state');
const formPostEntryParam = url.searchParams.get('form_post_entry');

if (formPostEntryParam || (codeParam && stateParam)) {
  journey.start({ resumeUrl: location.href });
}
```

As with the Suspended Authentication example, it's important that you pass the full URL and all query parameters from the magic link as the `resumeUrl`. Without all the parameters, the Widget may not be able to rehydrate the journey as needed.

## One-time password (OTP)

This common method of second-factor authentication is currently supported as an input, but not for registration, which will be released in an upcoming version. The node that is supported is the "OATH Token Verifier". To ensure it renders correctly within the Widget, place this node as a child node within a Page Node. Using the Page Node's "Stage" attribute, add the following value: `OneTimePassword`. The Widget will recognize this stage and optimally render this verification step.
