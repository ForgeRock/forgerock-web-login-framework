<script lang="ts">
  import { onMount } from 'svelte';

  import Box from '$components/primitives/box/centered.svelte';
  import Journey from '../lib/journey/journey.svelte';
  import { initialize as initializeJourney, type JourneyStore } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$lib/user/user.store';

  export let content;

  let journeyStore: JourneyStore = initializeJourney();
  let oauthStore: OAuthStore = initializeOAuth();
  let userStore: UserStore = initializeUser();

  /**
   * Sets up of locale store with appropriate locale content
   */
  initializeContent(content);

  // Use if not initializing journey in above "context module"
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
  }
</script>

<Box>
  <Journey {journeyStore} />
</Box>
