<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { configuration, component, journey, protect, user } from '$package/index';

  const config = configuration();
  const componentEvents = component();
  const journeyEvents = journey();

  let authIndexValueParam = $page.url.searchParams.get('authIndexValue');
  let journeyParam = $page.url.searchParams.get('journey');
  let recaptchaParam = $page.url.searchParams.get('recaptchaAction');
  let suspendedIdParam = $page.url.searchParams.get('suspendedId');
  let showPasswordParam = $page.url.searchParams.get('showPassword') as
    | 'none'
    | 'button'
    | 'checkbox';
  let initializePingProtectEarly = $page.url.searchParams.get('initializePingProtectEarly');
  let pauseBehavioralData = $page.url.searchParams.get('pauseBehavioralData');
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

  componentEvents.subscribe((event: { lastAction: string; reason?: string }) => {
    if (event.lastAction === 'mount') {
      console.log('Modal mounted');
    }
    if (event.lastAction === 'close') {
      console.log(`Modal closed due to ${event && event.reason}`);
    }
  });
  journeyEvents.subscribe(
    (event: {
      user: { successful?: boolean; response?: unknown; error?: unknown };
      journey: { error?: unknown };
      oauth: { error?: unknown };
    }) => {
      if (event?.user?.successful) {
        console.log(event.user);
        userResponse = event.user.response as UserResponseObj;
      }
      if (event.journey.error || event.oauth.error || event.user.error) {
        console.log('Login failure event fired');
      }
    },
  );

  onMount(async () => {
    let content;

    /**
     * Reuse translated content from locale api if not en-US
     */
    if (navigator.language !== 'en-US') {
      const response = await fetch(`${window.location.origin}/api/locale`);
      content = response.ok && (await response.json());
    }
    config.set({
      forgerock: {
        clientId: 'WebOAuthClient',
        redirectUri: `${window.location.origin}/callback`,
        scope: 'openid profile email me.read',
        serverConfig: {
          baseUrl: journeyParam?.includes('PingProtect')
            ? 'https://openam-protect2.forgeblocks.com/am'
            : 'https://openam-sdks.forgeblocks.com/am/',
          timeout: 5000,
        },
        realmPath: 'alpha',
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
        showPassword: showPasswordParam,
        logo: {
          dark: '/img/fr-logomark-white.png',
          light: '/img/fr-logomark-black.png',
        },
        sections: {
          header: false,
        },
      },
    });
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
  {:else}
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
<div bind:this={widgetEl} />
