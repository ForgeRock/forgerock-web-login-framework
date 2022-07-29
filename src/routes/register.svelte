<script context="module" lang="ts">
  import Box from '$components/primitives/box/centered.svelte';
  // import { initialize, type InitObject } from '$journey/journey.store';

  import '../app.css';

  // Loads first step on server.
  // IMPORTANT: Requires `window` to be removed from timeout utility in JS SDK
  // export async function load() {
  //   let initObj = await initialize('Registration');

  //   return {
  //     props: { initObj },
  //   }
  // }
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  import Journey from '../lib/journey/journey.svelte';
  import { initialize as initializeJourney, type JourneyStore } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$lib/user/user.store';

  export let content;

  let journeyStore: JourneyStore = initializeJourney({ tree: 'Registration' });
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
