<!--
  @component
  Type: stage
  Name: DefaultLogin

  DEMO COMPONENT
  ──────────────
  Copy this file into experimental/custom/stages/<your-name>/ to create your
  own stage override or extension, then rebuild with `pnpm build:widget`.

  HOW OVERRIDES WORK
  ──────────────────
  Setting `Name: DefaultLogin` makes this component replace the built-in
  DefaultLogin stage renderer. The framework's Vite plugin writes
  custom-registry.ts on every build (and watches in dev), mapping:

    "DefaultLogin" → this component

  map-stage.utilities.ts checks that registry before the built-in switch, so
  this component takes over the full form layout for every step whose AM stage
  name is "DefaultLogin".

  HOW EXTENSIONS WORK
  ───────────────────
  Set `Name:` to a stage name that does not exist in the built-in set
  (e.g. `Name: MyBrandedLogin`). The widget renders this component whenever an
  AM step reports that stage name. You control stage names via the AM journey
  editor — any string value configured there is valid.
-->

<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';

  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the framework's centralized
   * exports for custom components. No need to reach into internal aliases like
   * $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list):
   *   Components : Stacked, Button, Alert, Form, T, CallbackMapper
   *   Utilities  : interpolate, textToKey, convertStringToKey, captureLinks, styleStore
   *   Types      : CallbackMetadata, SelfSubmitFunction, StepMetadata,
   *                StageFormObject, StageJourneyObject, Maybe, StyleObject
   */
  import {
    Alert,
    Button,
    CallbackMapper,
    captureLinks,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
    T,
  } from '$login-framework';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  // ─── Stage props ─────────────────────────────────────────────────────────────
  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  // ─── Style store subscription ────────────────────────────────────────────────
  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((v) => (currentStyle = v));
  onDestroy(unsubStyle);

  // ─── Local state ─────────────────────────────────────────────────────────────
  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;

  // ─── Helper functions ────────────────────────────────────────────────────────
  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  // ─── Lifecycle hooks ─────────────────────────────────────────────────────────
  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  /**
   * onMount — fires once after the component is first inserted into the DOM.
   * captureLinks() attaches a click listener to linkWrapper that intercepts
   * anchor hrefs matching journey routes and navigates via journey.push/pop
   * instead of a full page reload. This is only relevant in modal mode where
   * normal navigation would close the dialog.
   */
  onMount(() => {
    if (componentStyle === 'modal') {
      captureLinks(linkWrapper, journey);
    }
  });

  // ─── Reactive block ──────────────────────────────────────────────────────────
  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<!--
  Form — the framework's form wrapper.
-->
<Form bind:formEl ariaDescribedBy="customFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <!--
    Custom branded header

    Customize this section with your own logo, headline, and subtitle copy.
  -->
  {#if componentStyle !== 'inline'}
    <div class="tw_flex tw_flex-col tw_items-center tw_gap-2 tw_mb-4">
      <!--
        Logo / icon placeholder.
        Replace this <div> with your own logo, e.g.:
          <img src="/your-logo.svg" alt="Acme Corp" class="tw_h-12" />
        Or import and use a Svelte icon component from your design system.
      -->
      <div
        class="tw_w-16 tw_h-16 tw_rounded-full tw_bg-blue-600 tw_flex tw_items-center tw_justify-center"
        aria-hidden="true"
      >
        <span class="tw_text-white tw_text-2xl tw_font-bold select-none">✦</span>
      </div>

      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="loginHeader" />
      </h1>

      <p class="tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light">
        {interpolate('customLoginSubtitle', null, 'Welcome back — please sign in to continue.')}
      </p>
    </div>
  {/if}

  {#if form?.message}
    <Alert id="customFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  <!--
    CallbackMapper loop — renders one callback component per callback in the step.
    The `#each` index (`idx`) is used to look up per-callback metadata.
  -->
  {#each step?.callbacks as callback, idx}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[idx],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  <!--
    Submit button — conditionally rendered.
  -->
  {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="loginButton" />
    </Button>
  {/if}

  <!--
    Journey links paragraph — rendered only outside inline mode.
  -->
  {#if componentStyle !== 'inline'}
    <p
      bind:this={linkWrapper}
      class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="dontHaveAnAccount" html={true} />
    </p>
  {/if}
</Form>
