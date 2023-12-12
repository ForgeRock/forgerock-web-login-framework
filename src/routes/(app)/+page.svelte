<script lang="ts">
  import { Config, FRUser, SessionManager } from '@forgerock/javascript-sdk';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  import Box from '$components/primitives/box/centered.svelte';
  import Journey from '$journey/journey.svelte';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$lib/user/user.store';

  import type { JourneyStore } from '$journey/journey.interfaces';

  /** @type {import('./$types').PageData} */
  export let data;

  const authIndexValue = $page.url.searchParams.get('authIndexValue');
  const codeParam = $page.url.searchParams.get('code');
  const stateParam = $page.url.searchParams.get('state');
  const formPostEntryParam = $page.url.searchParams.get('form_post_entry');
  const journeyParam = $page.url.searchParams.get('journey');
  const suspendedIdParam = $page.url.searchParams.get('suspendedId');

  const journeyStore: JourneyStore = initializeJourney();
  const oauthStore: OAuthStore = initializeOAuth();
  const userStore: UserStore = initializeUser();

  let name = '';

  async function logout() {
    const { clientId } = Config.get();

    /**
     * If configuration has a clientId, then use FRUser to logout to ensure
     * token revoking and removal; else, just end the session.
     */
    if (clientId) {
      // Call SDK logout
      await FRUser.logout();
    } else {
      await SessionManager.logout();
    }

    // Reset stores
    journeyStore.reset();
    oauthStore.reset();
    userStore.reset();
    // Fetch fresh journey step
    journeyStore.start({
      tree: journeyParam || authIndexValue || undefined,
    });
  }
  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  onMount(async () => {
    if (suspendedIdParam || formPostEntryParam || (codeParam && stateParam)) {
      journeyStore.resume(location.href);
      goto('/', { replaceState: true });
    } else {
      journeyStore.start({
        tree: journeyParam || authIndexValue || undefined,
        // recaptchaAction: 'MyTestAction',
      });
    }
  });

  $: {
    if ($journeyStore?.successful && !$oauthStore.completed) {
      oauthStore.get({ forceRenew: true });
    }
    if ($oauthStore?.successful && !$userStore.completed) {
      userStore.get();
    }
    name = ($userStore.response as { name: string })?.name;
  }
</script>

<Box>
  {#if !$userStore.successful}
    <Journey componentStyle="app" displayIcon={true} {journeyStore} />
  {:else}
    <p class="tw_mb-6">User: {name}</p>
    <button
      class="tw_button-base tw_focusable-element dark:tw_focusable-element_dark tw_button-secondary dark:tw_button-secondary_dark"
      on:click={logout}
    >
      Logout
    </button>
  {/if}
</Box>
