<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { get } from 'svelte/store';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Box from '$components/primitives/box/centered.svelte';
  import { applyLogoVars, applyThemeVars } from '$core/_effects/theme.effects';
  import { resolvePageTheme } from '$core/_utilities/theme.utilities';
  import { initialize as initializeContent } from '$core/locale.store';
  import { styleStore } from '$core/style.store';
  import Footer from '$custom/footer/footer.svelte';
  import Header from '$custom/header/header.svelte';
  import { deriveJourneyName } from '$journey/_utilities/journey-name.utilities';
  import {
    autoRestartStore,
    fallbackJourneyStore,
    initialize as initializeJourney,
    stack,
  } from '$journey/journey.store';
  import Journey from '$journey/journey.svelte';
  import { loginAppStages } from '$lib/stages';
  import {
    attachLegacyHashListener,
    buildLoginEntryQuery,
    runInitialEntry,
  } from './login-entry.effects';

  import type { JourneyStore } from '$journey/journey.interfaces';

  /** @type {import('./$types').PageData} */
  export let data;

  // The header/footer wrappers are user-owned files (not in this repo) that the
  // Vite plugin seeds on first build from its templates when absent. They mount
  // client-side only: the first journey step latches `wrappersVisible`, and the
  // wrappers then stay mounted through step nulling (start(), completion,
  // error), journey switches, and the redirect state.
  let wrappersVisible = false;
  // `browser` excludes the SSR pass explicitly: the wrappers are user code, and
  // even their module-level side effects must never run on the server. The step
  // check alone already implies this (step is only set after the client-side
  // journey start), so this is defense-in-depth, not a behavior change.
  $: if (browser && $journeyStore?.step) {
    wrappersVisible = true;
  }
  // Store subscription at the boundary: journeyName derives reactively from the
  // latest stack entry ('' = AM default journey). journey.svelte applies the
  // same step gate (core/journey/journey.svelte), so SSR never renders wrappers.
  $: journeyName = deriveJourneyName($stack);

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

  fallbackJourneyStore.set(data.fallbackJourney ?? undefined);

  let hasSubmitted = false;
  let redirectForm: HTMLFormElement | null = null;
  let loginResult: 'success' | 'failure' = 'failure';
  let tokenId = '';
  let journeyStepUrl = '';
  let journeyRootEl: HTMLDivElement;
  let legacyResumeFailed = false;
  let legacyResumeInProgress = false;
  let detachLegacyHashListener: (() => void) | null = null;
  let destroyed = false;

  function buildPreservedQuery(): Record<string, string> {
    return buildLoginEntryQuery({
      goto: data.redirectParams?.goto,
      gotoOnFail: data.redirectParams?.gotoOnFail,
      uuid: uuidParam,
    });
  }

  function handleStartOver(): void {
    legacyResumeFailed = false;
    journeyStore.start({
      journey: journeyParam || authIndexValue || '',
      query: buildPreservedQuery(),
    });
  }

  $: pageTheme = resolvePageTheme(
    $styleStore?.themeCatalog,
    $journeyStore?.metadata?.step?.derived?.themeId,
  );
  $: {
    applyThemeVars(journeyRootEl, pageTheme ?? $styleStore?.theme);
    applyLogoVars(journeyRootEl, $styleStore?.logo);
  }
  /**
   * Sets up locale store with appropriate content
   */
  initializeContent(data.content);

  // Use if not initializing journey in a "context module"
  // Legacy AM anchors use generic `#/service/<journey>` (for example
  // `#/service/FRForgotUsername`). Resume takes precedence; hash only
  // drives the start path. No window reads outside onMount/onDestroy.
  onMount(async () => {
    if (suspendedIdParam) {
      legacyResumeInProgress = true;
    }
    try {
      const outcome = await runInitialEntry(
        {
          href: window.location.href,
          hash: window.location.hash,
          suspendedId: suspendedIdParam,
          formPostEntry: formPostEntryParam,
          code: codeParam,
          state: stateParam,
          journeyParam,
          authIndexValue,
          goto: data.redirectParams?.goto,
          gotoOnFail: data.redirectParams?.gotoOnFail,
          uuid: uuidParam,
        },
        {
          resume: (href: string) => journeyStore.resume(href),
          start: (options: { journey: string; query: Record<string, string> }) =>
            journeyStore.start(options),
          goto: (url: string, options?: { replaceState?: boolean }) => goto(url, options),
          getPriorAutoRestart: () => get(autoRestartStore),
          setAutoRestart: (value: boolean) => autoRestartStore.set(value),
          getResumeState: () => get(journeyStore),
        },
      );
      if (outcome.kind === 'resumed-legacy-failed') {
        legacyResumeFailed = true;
      }
    } finally {
      legacyResumeInProgress = false;
    }

    if (destroyed) return;

    detachLegacyHashListener = attachLegacyHashListener(window, (hashJourney) => {
      journeyStore.start({
        journey: hashJourney,
        query: buildPreservedQuery(),
      });
    });
  });

  onDestroy(() => {
    destroyed = true;
    detachLegacyHashListener?.();
    detachLegacyHashListener = null;
  });

  $: {
    /**
     * hasSubmitted check prevents multiple form submissions
     * submit only when hasSubmitted is false, then set it to true
     * Legacy resume in progress/failed must not auto-post past the failed-resume UI.
     */
    if (
      $journeyStore?.completed &&
      !hasSubmitted &&
      !legacyResumeInProgress &&
      !legacyResumeFailed
    ) {
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

<div bind:this={journeyRootEl} class="tw_h-full tw_flex tw_flex-col">
  {#if wrappersVisible}
    <div class="tw_shrink-0" data-journey-name={journeyName}>
      <Header {journeyName} />
    </div>
  {/if}

  <main class="tw_flex-1 tw_min-h-0">
    <Box>
      <form method="POST" bind:this={redirectForm} hidden>
        <input type="hidden" name="loginResult" value={loginResult} />
        <input type="hidden" name="tokenId" value={tokenId} />
        <input type="hidden" name="journeyStepUrl" value={journeyStepUrl} />
      </form>

      {#if legacyResumeFailed}
        <p>Unable to resume session. It may have expired.</p>
        <a href="#" on:click|preventDefault={handleStartOver}>Start Over</a>
      {:else if hasSubmitted}
        <p class="tw_mb-6">You are being redirected...</p>
      {:else}
        <Journey
          componentStyle="app"
          displayIcon={true}
          {journeyStore}
          externalStages={loginAppStages}
        />
      {/if}
    </Box>
  </main>

  {#if wrappersVisible}
    <div class="tw_shrink-0" data-journey-name={journeyName}>
      <Footer {journeyName} />
    </div>
  {/if}
</div>
