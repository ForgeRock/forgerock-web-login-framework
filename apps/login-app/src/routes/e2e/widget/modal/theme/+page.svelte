<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/state';
  import Widget, { component, configure, journey } from '$package/index';

  let componentEvents: ReturnType<typeof component> | undefined = $state();
  let journeyEvents: ReturnType<typeof journey> | undefined = $state();
  let widgetEl: HTMLDivElement | undefined = $state();

  onMount(async () => {
    const params = page.url.searchParams;
    const primaryColorParam = params.get('primaryColor');
    const buttonBorderRadiusParam = params.get('buttonBorderRadius');
    const cardBorderRadiusParam = params.get('cardBorderRadius');

    await configure({
      serverConfig: {
        wellknown:
          'https://openam-sdks.forgeblocks.com/am/oauth2/alpha/.well-known/openid-configuration',
      },
      oidcClient: {
        clientId: 'WebOAuthClient',
        redirectUri: `${window.location.origin}/callback`,
        scope: 'openid profile email me.read',
      },
      style: {
        theme: {
          ...(primaryColorParam !== null ? { primaryColor: primaryColorParam } : {}),
          ...(buttonBorderRadiusParam !== null
            ? { buttonBorderRadius: Number(buttonBorderRadiusParam) }
            : {}),
          ...(cardBorderRadiusParam !== null
            ? { cardBorderRadius: Number(cardBorderRadiusParam) }
            : {}),
        },
      },
    });

    componentEvents = component();
    journeyEvents = journey();

    new Widget({ target: widgetEl! });
  });
</script>

<div class="tw_p-6">
  {#if journeyEvents && componentEvents}
    <button
      onclick={() => {
        journeyEvents.start({ journey: 'TEST_Login' });
        componentEvents.open();
      }}
    >
      Open Login Modal
    </button>
  {/if}
</div>
<div bind:this={widgetEl}></div>
