<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  import { REDIRECT_FALLBACK } from '$lib/redirect.constants';

  import Box from '$components/primitives/box/centered.svelte';
  import Journey from '$journey/journey.svelte';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$core/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$core/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$core/user/user.store';

  import type { JourneyStore } from '$journey/journey.interfaces';

  /** @type {import('./$types').PageData} */
  export let data;

  const authIndexValue = $page.url.searchParams.get('authIndexValue');
  const codeParam = $page.url.searchParams.get('code');
  const stateParam = $page.url.searchParams.get('state');
  const formPostEntryParam = $page.url.searchParams.get('form_post_entry');
  const journeyParam = $page.url.searchParams.get('journey');
  const suspendedIdParam = $page.url.searchParams.get('suspendedId');

  const journeyStore: JourneyStore = initializeJourney();
  const oauthStore: OAuthStore = initializeOAuth();
  const userStore: UserStore = initializeUser();

  let name = '';

  // Ensures we only trigger the post-login redirect once
  // to avoid re-running multiple times as journey/oauth/user stores update.
  let hasRedirected = false;

  async function redirectAfterLogin() {
    const accessToken = $oauthStore.response?.accessToken;

    if (!accessToken) {
      window.location.assign(REDIRECT_FALLBACK);
      return;
    }

    try {
      const response = await fetch('/api/redirect', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        window.location.assign(REDIRECT_FALLBACK);
        return;
      }

      const body = (await response.json()) as { redirectUri?: string };
      window.location.assign(body.redirectUri || REDIRECT_FALLBACK);
    } catch {
      window.location.assign(REDIRECT_FALLBACK);
    }
  }

  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  onMount(async () => {
    if (suspendedIdParam || formPostEntryParam || (codeParam && stateParam)) {
      journeyStore.resume(location.href);
      goto('/', { replaceState: true });
    } else {
      journeyStore.start({
        tree: journeyParam || authIndexValue || undefined,
        // recaptchaAction: 'MyTestAction',
      });
    }
  });

  $: {
    if ($journeyStore?.successful && !$oauthStore.completed) {
      oauthStore.get({ forceRenew: true });
    }
    if ($oauthStore?.successful && !$userStore.completed) {
      userStore.get();
    }
    name = ($userStore.response as { name: string })?.name;

    if (browser && $userStore?.successful && !hasRedirected) {
      hasRedirected = true;
      redirectAfterLogin();
    }
  }
</script>

<Box>
  {#if !$userStore.successful}
    <Journey componentStyle="app" displayIcon={true} {journeyStore} />
  {:else}
      <p class="tw_mb-6">{name}, you are being redirected...</p>
  {/if}
</Box>
