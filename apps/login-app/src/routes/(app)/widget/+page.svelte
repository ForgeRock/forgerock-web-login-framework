<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import Box from '$components/primitives/box/centered.svelte';
  import Widget, { configure, journey } from '$package/index';

  /** @type {import('./$types').PageData} */
  export let data;

  const journeyParam = $page.url.searchParams.get('journey');
  let formEl: HTMLDivElement;

  onMount(async () => {
    await configure({
      serverConfig: { wellknown: data.wellknown },
      oidcClient: {
        clientId: data.oauthClientId,
        redirectUri: `${window.location.origin}/widget`,
        scope: data.oauthScope,
      },
    });

    const journeyEvents = journey();

    new Widget({ target: formEl, props: { type: 'inline' } });

    journeyEvents.start({
      journey: journeyParam || data.journeyName || undefined,
    });
  });
</script>

<Box>
  <div bind:this={formEl}></div>
</Box>
