<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import Widget, { configure, journey } from '$package/index';

  import type { PageData } from './$types';

  export let data: PageData;

  let formEl: HTMLDivElement;

  $: idmTheme = data.idmTheme;

  onMount(async () => {
    const params = $page.url.searchParams;
    const primaryColorParam = params.get('primaryColor');
    const buttonBorderRadiusParam = params.get('buttonBorderRadius');
    const cardBorderRadiusParam = params.get('cardBorderRadius');
    const themeCatalogParam = params.get('themeCatalog');

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
        // A static logo must be configured for the `tw_dialog-logo` element to render at
        // all in inline mode, so the E2E spec can assert the page theme's logo override
        // (`--logo-light` / `--fr-logo-height`) takes effect over this fallback.
        logo: {
          light: 'https://example.com/fallback-logo.png',
          dark: 'https://example.com/fallback-logo.png',
        },
        theme: {
          ...idmTheme,
          ...(primaryColorParam !== null ? { primaryColor: primaryColorParam } : {}),
          ...(buttonBorderRadiusParam !== null
            ? { buttonBorderRadius: Number(buttonBorderRadiusParam) }
            : {}),
          ...(cardBorderRadiusParam !== null
            ? { cardBorderRadius: Number(cardBorderRadiusParam) }
            : {}),
        },
        ...(idmTheme?.logo && {
          logo: {
            light: idmTheme.logo,
            dark: idmTheme.logo,
            ...(idmTheme.logoHeight && { height: idmTheme.logoHeight }),
          },
        }),
        ...(themeCatalogParam !== null ? { themeCatalog: JSON.parse(themeCatalogParam) } : {}),
      },
    });

    const journeyEvents = journey();

    new Widget({ target: formEl, props: { type: 'inline' } });
    journeyEvents.start({ journey: 'TEST_Login' });
  });
</script>

<div bind:this={formEl} class="tw_p-6"></div>
