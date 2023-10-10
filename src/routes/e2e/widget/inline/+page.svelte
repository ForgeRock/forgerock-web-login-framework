<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { configuration, component, journey, user } from '$package/index';
  import type { UserStoreValue } from '$lib/widget/types';

  type UserResponseObj = {
    family_name: string;
    given_name: string;
    email: string;
  };

  const config = configuration();
  const componentEvents = component();
  const journeyEvents = journey();

  let authIndexValueParam = $page.url.searchParams.get('authIndexValue');
  let journeyParam = $page.url.searchParams.get('journey');
  let suspendedIdParam = $page.url.searchParams.get('suspendedId');
  let formEl: HTMLDivElement;
  let userEvent: UserStoreValue | null;
  let userResponse: UserResponseObj | null;

  async function logout() {
    await user.logout();
    userEvent = null;
    userResponse = null;
  }

  componentEvents.subscribe((event) => {
    if (event.lastAction === 'mount') {
      console.log('Form mounted');
    }
  });
  journeyEvents.subscribe((event) => {
    if (event?.user?.successful) {
      userEvent = event.user;
      userResponse = event.user.response as UserResponseObj;
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

{#if userEvent?.successful}
  <ul>
    <li id="fullName">
      <strong>Full name</strong>: {`${userResponse?.given_name} ${userResponse?.family_name}`}
    </li>
    <li id="email"><strong>Email</strong>: {userResponse?.email}</li>
  </ul>
  <button on:click={logout}>Logout</button>
{/if}
<div bind:this={formEl} class={`${userEvent?.successful ? 'tw_hidden' : ''} tw_p-6`} />
