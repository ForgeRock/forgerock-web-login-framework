<script context="module" lang="ts">
  import type { LoadEvent } from '@sveltejs/kit';

  import configure from '$lib/config/config';
  import { getLocaleDir } from '$lib/utilities/i18n.utilities';
  import { locale, initializeContent } from '$lib/locale.store';

  configure({
    clientId: 'WebOAuthClient',
    // redirectUri: 'https://crbrl.ngrok.io/callback',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile me.read',
    serverConfig: {
      baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
      // baseUrl: 'https://crbrl.ngrok.io/proxy/',
      timeout: 5000,
    },
    realmPath: 'alpha',
    tree: 'Login',
  });

  /** @type {import('./__types/[slug]').Load} */
  export async function load(event: LoadEvent) {
    const userLocale = event.session.locale;

    locale.set(userLocale);

    const localDir = getLocaleDir(userLocale);


    try {
      if (localDir !== 'us/en') {
        /**
         * en-US is loaded by default, so only import other locales
         */
        let content = await import(`../../locales/${localDir}/index.json`);
        initializeContent(content);
      } else {
        initializeContent();
      }
    } catch (err) {
      // If there's a failure or unsupported locale, fallback to en-US
      initializeContent();
    }

    return {};
  }
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
  <link rel="icon" href="/favicon.ico" />
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
      src: local(''), url('/open-sans/open-sans-v29-latin-300.woff2') format('woff2');
    }
    /* open-sans-regular - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 400;
      src: local(''), url('/open-sans/open-sans-v29-latin-regular.woff2') format('woff2');
    }
    /* open-sans-700 - latin */
    @font-face {
      font-display: swap;
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 700;
      src: local(''), url('/open-sans/open-sans-v29-latin-700.woff2') format('woff2');
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

<slot />
