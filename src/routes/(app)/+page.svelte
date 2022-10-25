<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let journeyParam = $page.url.searchParams.get('journey');

  import Box from '$components/primitives/box/centered.svelte';
  import Journey from '$journey/journey.svelte';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import type { JourneyStore } from '$journey/journey.interfaces';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$lib/user/user.store';
  import { Config, FRUser, SessionManager } from '@forgerock/javascript-sdk';

  /** @type {import('./$types').PageData} */
  export let data;

  let journeyStore: JourneyStore = initializeJourney({ tree: journeyParam || 'Login' });
  let oauthStore: OAuthStore = initializeOAuth();
  let userStore: UserStore = initializeUser();

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
    journeyStore.next();
  }

  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  onMount(async () => {
    journeyStore.next();
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
    <Journey displayIcon={true} {journeyStore} />
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
