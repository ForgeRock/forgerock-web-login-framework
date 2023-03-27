<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import Box from '$components/primitives/box/centered.svelte';
  import Journey from '../../../lib/journey/journey.svelte';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$lib/user/user.store';

  import type { JourneyStore } from '$journey/journey.interfaces';

  /** @type {import('./$types').PageData} */
  export let data;

  const journeyStore: JourneyStore = initializeJourney();
  const oauthStore: OAuthStore = initializeOAuth();
  const userStore: UserStore = initializeUser();

  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  onMount(async () => {
    journeyStore.start({ tree: 'Registration' });
  });

  $: {
    if ($journeyStore?.successful && !$oauthStore.completed) {
      oauthStore.get({ forceRenew: true });
    }
    if ($oauthStore?.successful && !$userStore.completed) {
      userStore.get();
      goto('/');
    }
    if ($userStore?.successful) {
      goto('/');
    }
  }
</script>

<Box>
  <Journey componentStyle="app" displayIcon={true} {journeyStore} />
</Box>
