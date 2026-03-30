<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { z } from 'zod';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  import { normalizeRedirectParam } from '$lib/redirect.utilities';

  import Box from '$components/primitives/box/centered.svelte';
  import Journey from '$journey/journey.svelte';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$core/locale.store';
  import { initialize as initializeOAuth, type OAuthStore } from '$core/oauth/oauth.store';
  import { initialize as initializeUser, type UserStore } from '$core/user/user.store';

  import type { JourneyStore } from '$journey/journey.interfaces';
  import type { FRLoginSuccess } from '@forgerock/javascript-sdk';

  /** @type {import('./$types').PageData} */
  export let data;

  const authIndexValue = $page.url.searchParams.get('authIndexValue');
  const codeParam = $page.url.searchParams.get('code');
  const stateParam = $page.url.searchParams.get('state');
  const formPostEntryParam = $page.url.searchParams.get('form_post_entry');
  const gotoParam = $page.url.searchParams.get('goto');
  const gotoOnFailParam = $page.url.searchParams.get('gotoOnFail');
  const journeyParam = $page.url.searchParams.get('journey');
  const suspendedIdParam = $page.url.searchParams.get('suspendedId');

  const journeyStore: JourneyStore = initializeJourney();
  const oauthStore: OAuthStore = initializeOAuth();
  const userStore: UserStore = initializeUser();

  let name = '';

  // Ensures we only trigger the post-login redirect once
  // to avoid re-running multiple times as journey/oauth/user stores update.
  let hasRedirected = false;
  
  const REDIRECT_FALLBACK = 'https://www.pingidentity.com/en.html';

  async function redirectAfterLogin(
    accessToken: string | undefined,
    url?: string,
    isGotoOnFail = false,
    failureUrl = '',
  ): Promise<void> {
    if (!accessToken) {
      if (isGotoOnFail) {
        handleRedirect(undefined, true, failureUrl);
        return;
      }

      window.location.assign(REDIRECT_FALLBACK);
      return;
    }

    try {
      const response = await fetch('/api/redirect', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url,
          isGotoOnFail,
        }),
      });

      if (!response.ok) {
        window.location.assign(REDIRECT_FALLBACK);
        return;
      }

      const body = z.object({ redirectUrl: z.string().optional() }).parse(await response.json());
      handleRedirect(body.redirectUrl, isGotoOnFail, failureUrl);
    } catch {
      handleRedirect(undefined, isGotoOnFail, failureUrl);
    }
  }

  function handleRedirect(
    redirectUrl: string | undefined,
    isGotoOnFail: boolean,
    failureUrl = '',
  ): void {
    if (isGotoOnFail) {
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      if (failureUrl) {
        window.location.assign(failureUrl);
        return;
      }

      window.location.assign(REDIRECT_FALLBACK);
      return;
    }

    if (redirectUrl) {
      window.location.assign(redirectUrl);
      return;
    }

    window.location.assign(REDIRECT_FALLBACK);
  }

  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  onMount(async () => {
    if (suspendedIdParam || formPostEntryParam || (codeParam && stateParam)) {
      await journeyStore.resume(location.href);
      goto('/', { replaceState: true });
    } else {
      const query: Record<string, string> = {};

      if (gotoParam) {
        const normalized = normalizeRedirectParam(gotoParam, window.location.origin);
        if (normalized) query.goto = normalized;
      }

      if (gotoOnFailParam) {
        const normalized = normalizeRedirectParam(gotoOnFailParam, window.location.origin);
        if (normalized) query.gotoOnFail = normalized;
      }

      journeyStore.start({
        tree: journeyParam || authIndexValue || undefined,
        ...(Object.keys(query).length ? { query } : {}),
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
    const parsed = z.object({ name: z.string() }).safeParse($userStore.response);
    name = parsed.success ? parsed.data.name : '';
    const accessToken = $oauthStore.response?.accessToken;

    if (browser && $userStore?.successful && !hasRedirected) {
      hasRedirected = true;
      redirectAfterLogin(accessToken, ($journeyStore.step as FRLoginSuccess)?.getSuccessUrl(), false);
    }

    if (browser && !$userStore?.successful && $journeyStore?.completed && !$journeyStore?.successful && !hasRedirected) {
      hasRedirected = true;
      const failureUrl = $journeyStore?.step?.payload?.detail?.failureUrl;
      redirectAfterLogin(accessToken, gotoOnFailParam ?? undefined, true, failureUrl);
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