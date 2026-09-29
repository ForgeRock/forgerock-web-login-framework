<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import Box from '$components/primitives/box/centered.svelte';
  import { applyLogoVars, applyThemeVars } from '$core/_effects/theme.effects';
  import { initialize as initializeLinks } from '$core/links.store';
  import { initialize as initializeContent } from '$core/locale.store';
  import { styleStore } from '$core/style.store';
  import { initialize as initializeStyles } from '$core/style.store';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import Journey from '$journey/journey.svelte';
  import { loginAppStages } from '$lib/stages';

  import type { JourneyStore } from '$journey/journey.interfaces';

  let journeyRootEl: HTMLDivElement;

  const journeyStore: JourneyStore = initializeJourney({
    serverConfig: {
      wellknown:
        'https://openam-sdks.forgeblocks.com/am/oauth2/alpha/.well-known/openid-configuration',
    },
  });

  initializeLinks({ termsAndConditions: 'https://www.forgerock.com/terms' });

  /**
   * Sets up the locale store with the default (us/en) message catalog so the
   * stages render real locale strings instead of key-derived fallback text.
   */
  initializeContent();

  onMount(() => {
    const params = $page.url.searchParams;
    const logoLightParam = params.get('logoLight');
    const logoDarkParam = params.get('logoDark');
    const logoHeightParam = params.get('logoHeight');
    const logoWidthParam = params.get('logoWidth');

    initializeStyles({
      logo: {
        ...(logoLightParam !== null ? { light: logoLightParam } : {}),
        ...(logoDarkParam !== null ? { dark: logoDarkParam } : {}),
        ...(logoHeightParam !== null ? { height: Number(logoHeightParam) } : {}),
        ...(logoWidthParam !== null ? { width: Number(logoWidthParam) } : {}),
      },
    });

    journeyStore.start({ journey: params.get('journey') || 'TEST_Login', query: {} });
  });

  $: {
    applyThemeVars(journeyRootEl, $styleStore?.theme);
    applyLogoVars(journeyRootEl, $styleStore?.logo);
  }
</script>

<div bind:this={journeyRootEl} class="fr_widget-root tw_h-full">
  <Box>
    <Journey
      componentStyle="app"
      displayIcon={true}
      {journeyStore}
      externalStages={loginAppStages}
    />
  </Box>
</div>
