<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { configuration, component, journey, user } from '$package/index';

  const config = configuration();
  const componentEvents = component();
  const journeyEvents = journey();

  let authIndexValueParam = $page.url.searchParams.get('authIndexValue');
  let codeParam = $page.url.searchParams.get('code');
  let journeyParam = $page.url.searchParams.get('journey');
  let stateParam = $page.url.searchParams.get('state');
  let suspendedIdParam = $page.url.searchParams.get('suspendedId');

  let userResponse: any | null;
  let widgetEl: HTMLDivElement;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  componentEvents.subscribe((event) => {
    if (event.lastAction === 'mount') {
      console.log('Modal mounted');
    }
    if (event.lastAction === 'close') {
      console.log(`Modal closed due to ${event && event.reason}`);
    }
  });
  journeyEvents.subscribe((event) => {
    if (event?.user?.successful) {
      console.log(event.user);
      userResponse = event.user;
    }
    if (event.journey.error || event.oauth.error || event.user.error) {
      console.log('Login failure event fired');
    }
  });

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
          baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
          timeout: 5000,
        },
        realmPath: 'alpha',
      },
      content,
      journeys: {
        forgotPassword: {
          journey: 'TEST_ResetPasword',
          match: ['#/service/TEST_ResetPassword', '?journey=TEST_ResetPassword', '#/service/ResetPassword', '?journey=ResetPassword'],
        },
        forgotUsername: {
          journey: 'TEST_ForgottenUsername',
          match: ['#/service/TEST_ForgottenUsername', '?journey=TEST_ForgottenUsername', '#/service/ForgottenUsername', '?journey=ForgottenUsername']
        },
        login: {
          journey: 'TEST_Login',
          match: ['#/service/TEST_Login', '?journey', '?journey=TEST_Login', '#/service/Login', '?journey', '?journey=Login'],
        },
        register: {
          journey: 'TEST_Registration',
          match: ['#/service/TEST_Registration', '?journey=TEST_Registration', '#/service/Registration', '?journey=Registration'],
        },
      },
      links: {
        termsAndConditions: 'https://www.forgerock.com/terms',
      },
      style: {
        labels: 'floating',
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
  });
</script>

<div class="tw_p-6">
  {#if userResponse}
    <ul>
      <li id="fullName">
        <strong>Full name</strong>: {`${userResponse.response?.given_name} ${userResponse.response?.family_name}`}
      </li>
      <li id="email"><strong>Email</strong>: {userResponse.response?.email}</li>
    </ul>
    <button on:click={logout}>Logout</button>
  {:else}
    <button
      on:click={() => {
        journeyEvents.start({
          journey: journeyParam || authIndexValueParam || undefined,
          resumeUrl: suspendedIdParam ? location.href : undefined,
        });
        componentEvents.open();
      }}
    >
      Open Login Modal
    </button>
  {/if}
</div>
<div bind:this={widgetEl} />
