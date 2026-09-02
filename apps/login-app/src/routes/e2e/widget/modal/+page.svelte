<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import Widget, { component, configure, journey, protect, user } from '$package/index';

  import type {
    ComponentEventValue,
    JourneyStoreValue,
    OAuthTokenStoreValue,
    UserStoreValue,
  } from '$package/types';

  let componentEvents: ReturnType<typeof component> | undefined;
  let journeyEvents: ReturnType<typeof journey> | undefined;

  let authIndexValueParam = $page.url.searchParams.get('authIndexValue');
  let journeyParam = $page.url.searchParams.get('journey');
  let recaptchaParam = $page.url.searchParams.get('recaptchaAction');
  const captchaModeRaw = $page.url.searchParams.get('captchaMode');
  const captchaModeParam =
    captchaModeRaw === 'visible' || captchaModeRaw === 'invisible' ? captchaModeRaw : null;
  let suspendedIdParam = $page.url.searchParams.get('suspendedId');
  let showPasswordParam = $page.url.searchParams.get('showPassword') as
    | 'none'
    | 'button'
    | 'checkbox';
  let initializePingProtectEarly = $page.url.searchParams.get('initializePingProtectEarly');
  let pauseBehavioralData = $page.url.searchParams.get('pauseBehavioralData');
  const hideScriptedTextOutputParam =
    $page.url.searchParams.get('hideScriptedTextOutput') === 'true';
  const textOutputStyle = hideScriptedTextOutputParam ? { script: 'hidden' } : undefined;
  type UserResponseObj = {
    family_name: string;
    given_name: string;
    email: string;
  };
  let userResponse: UserResponseObj | null;
  let widgetEl: HTMLDivElement;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  onMount(async () => {
    let content;

    /**
     * Reuse translated content from locale api if not en-US
     */
    if (navigator.language !== 'en-US') {
      const response = await fetch(`${window.location.origin}/api/locale`);
      content = response.ok && (await response.json());
    }

    await configure({
      serverConfig: {
        wellknown:
          'https://openam-sdks.forgeblocks.com/am/oauth2/alpha/.well-known/openid-configuration',
      },
      oidcClient: {
        clientId: 'WebOAuthClient',
        redirectUri: `${window.location.origin}/callback`,
        scope: 'openid profile email me.read',
      },
      content: {
        ...content,
        alreadyHaveAnAccount: `Already have an account? <a href="?journey=TEST_Login">Sign in here!</a>`,
      },
      journeys: {
        forgotPassword: {
          journey: 'TEST_ResetPasword',
          match: [
            '#/service/TEST_ResetPassword',
            '?journey=TEST_ResetPassword',
            '#/service/ResetPassword',
            '?journey=ResetPassword',
          ],
        },
        forgotUsername: {
          journey: 'TEST_ForgottenUsername',
          match: [
            '#/service/TEST_ForgottenUsername',
            '?journey=TEST_ForgottenUsername',
            '#/service/ForgottenUsername',
            '?journey=ForgottenUsername',
          ],
        },
        login: {
          journey: 'TEST_Login',
          match: [
            '#/service/TEST_Login',
            '?journey',
            '?journey=TEST_Login',
            '#/service/Login',
            '?journey',
            '?journey=Login',
          ],
        },
        register: {
          journey: 'TEST_Registration',
          match: [
            '#/service/TEST_Registration',
            '?journey=TEST_Registration',
            '#/service/Registration',
            '?journey=Registration',
          ],
        },
      },
      links: {
        termsAndConditions: 'https://www.forgerock.com/terms',
      },
      style: {
        labels: 'floating',
        // showPasswordParam is null when the URL param is absent; zod's `.optional()`
        // accepts undefined but not null, so only include it when set
        ...(showPasswordParam && { showPassword: showPasswordParam }),
        logo: {
          dark: '/img/fr-logomark-white.png',
          light: '/img/fr-logomark-black.png',
        },
        sections: {
          header: false,
        },
        callbacks: {
          textOutput: textOutputStyle,
        },
      },
      captcha: captchaModeParam ? { mode: captchaModeParam } : undefined,
    });

    componentEvents = component();
    journeyEvents = journey();

    componentEvents.subscribe((event: ComponentEventValue) => {
      if (event.lastAction === 'mount') {
        console.log('Modal mounted');
      }
      if (event.lastAction === 'close') {
        console.log(`Modal closed due to ${event && event.reason}`);
      }
    });

    journeyEvents.subscribe(
      (event: {
        journey: JourneyStoreValue;
        oauth: OAuthTokenStoreValue;
        user: UserStoreValue;
      }) => {
        if (event?.user?.successful) {
          console.log(event.user);
          userResponse = event.user.response as unknown as UserResponseObj;
        }
        if (event.journey.error || event.oauth.error || event.user.error) {
          console.log('Login failure event fired');
        }
      },
    );

    new Widget({ target: widgetEl });
    if (initializePingProtectEarly) {
      await protect.start({
        envId: initializePingProtectEarly,
        behavioralDataCollection: pauseBehavioralData === 'true',
        consoleLogEnabled:
          initializePingProtectEarly && initializePingProtectEarly?.length !== 0 ? true : false,
      });
      await protect.getData();
      protect.pauseBehavioralData();
      protect.resumeBehavioralData();
    }
  });
</script>

<div class="tw_p-6">
  {#if userResponse}
    <ul>
      <li id="fullName">
        <strong>Full name</strong>: {`${userResponse?.given_name} ${userResponse?.family_name}`}
      </li>
      <li id="email"><strong>Email</strong>: {userResponse?.email}</li>
    </ul>
    <button on:click={logout}>Logout</button>
  {:else if journeyEvents && componentEvents}
    <button
      on:click={() => {
        journeyEvents.start({
          journey: journeyParam || authIndexValueParam || undefined,
          resumeUrl: suspendedIdParam ? location.href : undefined,
          recaptchaAction: recaptchaParam ?? undefined,
        });
        componentEvents.open();
      }}
    >
      Open Login Modal
    </button>
  {/if}
</div>
<div bind:this={widgetEl}></div>
