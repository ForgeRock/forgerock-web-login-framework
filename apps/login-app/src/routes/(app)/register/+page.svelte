<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import Box from '$components/primitives/box/centered.svelte';
  import { initialize as initializeContent } from '$core/locale.store';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import Journey from '$journey/journey.svelte';
  import { loginAppStages } from '$lib/stages';

  import type { JourneyStore } from '$journey/journey.interfaces';

  
  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();

  const journeyStore: JourneyStore = initializeJourney({
    serverConfig: {
      wellknown: data.wellknown,
    },
  });

  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  onMount(async () => {
    journeyStore.start({ journey: 'Registration' });
  });

  run(() => {
    if ($journeyStore?.successful) {
      goto('/');
    }
  });
</script>

<Box>
  <Journey componentStyle="app" displayIcon={true} {journeyStore} externalStages={loginAppStages} />
</Box>
