<!--

 Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { buildThemeVarsEntries } from '$core/_utilities/theme.utilities';

  import type { ThemeObject } from '$core/style.store';

  interface Props {
    data: { idmTheme?: ThemeObject; backgroundImageUrl?: string };
    children?: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();

  let themeStyle = $derived([
    ...(data.idmTheme ? buildThemeVarsEntries(data.idmTheme) : []),
    ...(data.backgroundImageUrl
      ? [['--fr-page-bg-image', `url("${data.backgroundImageUrl}")`] as [string, string]]
      : []),
  ]
    .map(([k, v]) => `${k}:${v}`)
    .join(';'));
</script>

<svelte:head>
  <!--
    Let's preload the main font-file to ensure we can render quickly
   -->
  <link
    rel="preload"
    as="font"
    type="font/woff2"
    href="/open-sans/open-sans-v29-latin-regular.woff2"
    crossorigin="anonymous"
  />

  <meta charset="utf-8" />
  <title>Login Application</title>
  <link rel="icon" href={data.idmTheme?.favicon ?? '/favicon.ico'} />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    /**
     * Self-hosting Open Sans for better privacy, potential performance and control
     * Reference: https://wpspeedmatters.com/self-host-google-fonts/
     */
    /* open-sans-300 - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 300;
      src:
        local(''),
        url('/open-sans/open-sans-v29-latin-300.woff2') format('woff2');
    }
    /* open-sans-regular - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 400;
      src:
        local(''),
        url('/open-sans/open-sans-v29-latin-regular.woff2') format('woff2');
    }
    /* open-sans-700 - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 700;
      src:
        local(''),
        url('/open-sans/open-sans-v29-latin-700.woff2') format('woff2');
    }

    /**
     * This style block allows for the vertical expansion of the html
     * and body element to full height regardless of context height.
     */
    html,
    body,
    .root {
      height: 100%;
      min-height: 100%;
    }

    html {
      background-color: #f6f8fa;
    }

    /**
     * This ensures those with dark theme on, they don't get a flash of a
     * bright white background before the remaining CSS loads and darkens it.
     */
    @media (prefers-color-scheme: dark) {
      html {
        background-color: black;
        color: white;
      }
    }
  </style>
</svelte:head>

<div class="theme-root" style={themeStyle}>
  {@render children?.()}
</div>

<style>
  .theme-root {
    height: 100%;
  }
</style>
