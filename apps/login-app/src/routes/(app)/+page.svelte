<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Box from '$components/primitives/box/centered.svelte';
  import { initialize as initializeContent } from '$core/locale.store';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import Journey from '$journey/journey.svelte';
  import { appStages } from '$lib/stages';

  import type { JourneyStore } from '$journey/journey.interfaces';

  /** @type {import('./$types').PageData} */
  export let data;

  const authIndexValue = $page.url.searchParams.get('authIndexValue');
  const codeParam = $page.url.searchParams.get('code');
  const stateParam = $page.url.searchParams.get('state');
  const formPostEntryParam = $page.url.searchParams.get('form_post_entry');
  const journeyParam = $page.url.searchParams.get('journey');
  const suspendedIdParam = $page.url.searchParams.get('suspendedId');
  const uuidParam = $page.url.searchParams.get('uuid');
  const captchaModeRaw = $page.url.searchParams.get('captchaMode');
  const captchaModeParam =
    captchaModeRaw === 'visible' || captchaModeRaw === 'invisible' ? captchaModeRaw : null;

  const journeyStore: JourneyStore = initializeJourney(
    { serverConfig: { wellknown: data.wellknown } },
    captchaModeParam ? { captcha: { mode: captchaModeParam } } : null,
  );

  let hasSubmitted = false;
  let redirectForm: HTMLFormElement | null = null;
  let loginResult: 'success' | 'failure' = 'failure';
  let tokenId = '';
  let journeyStepUrl = '';
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
      // noSession set to false is required to receive session token from AM
      const query: Record<string, string> = {
        noSession: 'false',
      };

      /**
       * goto and gotoOnFail are sent at the beginning of journey
       * to support temporarily suspended flows like email verification
       * and to help AM set journey step successUrl
       */
      query.goto = data.redirectParams?.goto;
      query.gotoOnFail = data.redirectParams?.gotoOnFail;
      if (uuidParam) {
        query.uuid = uuidParam;
      }

      journeyStore.start({
        journey: journeyParam || authIndexValue || '',
        query,
      });
    }
  });

  $: {
    /**
     * hasSubmitted check prevents multiple form submissions
     * submit only when hasSubmitted is false, then set it to true
     */
    if ($journeyStore?.completed && !hasSubmitted) {
      hasSubmitted = true;

      if ($journeyStore?.successful) {
        loginResult = 'success';
        journeyStepUrl = $journeyStore?.response?.successUrl ?? '';
        tokenId = $journeyStore?.response?.tokenId ?? '';
      } else {
        loginResult = 'failure';
        journeyStepUrl =
          $journeyStore?.step?.payload?.detail?.failureUrl ??
          // Some failure flows store failureUrl in error.detail instead of step payload.
          $journeyStore?.error?.detail?.failureUrl ??
          '';
      }

      // wait until the DOM is updated before submitting
      tick().then(() => {
        if (redirectForm) {
          // use submit() instead of the modern requestSubmit() for compatibility with old browsers
          redirectForm.submit();
        }
      });
    }
  }
</script>

<Box>
  <form method="POST" bind:this={redirectForm} hidden>
    <input type="hidden" name="loginResult" value={loginResult} />
    <input type="hidden" name="tokenId" value={tokenId} />
    <input type="hidden" name="journeyStepUrl" value={journeyStepUrl} />
  </form>

  {#if hasSubmitted}
    <p class="tw_mb-6">You are being redirected...</p>
  {:else}
    <Journey componentStyle="app" displayIcon={true} {journeyStore} stages={appStages} />
  {/if}
</Box>
