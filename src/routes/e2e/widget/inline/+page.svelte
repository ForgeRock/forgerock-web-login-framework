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

  let formEl: HTMLDivElement;
  // TODO: Use a more specific type
  let userResponse: any | null;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  componentEvents.subscribe((event) => {
    if (event.lastAction === 'mount') {
      console.log('Form mounted');
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
      links: {
        termsAndConditions: 'https://www.forgerock.com/terms',
      },
    });

    new Widget({ target: formEl, props: { type: 'inline' } });

    // Start the  journey after initialization or within the form.onMount event
    journeyEvents.start({
      journey: journeyParam || authIndexValueParam || undefined,
      resumeUrl: suspendedIdParam ? location.href : undefined,
    });
  });
</script>

{#if userResponse?.successful}
  <ul>
    <li id="fullName">
      <strong>Full name</strong>: {`${userResponse.response?.given_name} ${userResponse.response?.family_name}`}
    </li>
    <li id="email"><strong>Email</strong>: {userResponse.response?.email}</li>
  </ul>
  <button on:click={logout}>Logout</button>
{/if}
<div bind:this={formEl} class={`${userResponse?.successful ? 'tw_hidden' : ''} tw_p-6`} />
