<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<!--
@component
Type: stage
Name: __COMPONENT_NAME__

Custom stage component. Replace this description with your own.

A stage controls the layout and submission behaviour of an entire authentication
step (page node). It receives the full JourneyStep, maps each callback to its
component via CallbackMapper, and renders the form chrome (header, alerts,
submit button, links).
-->

<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';

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

  /** Display mode — determines which chrome is visible (header, links, etc.). */
  export let componentStyle: 'app' | 'inline' | 'modal';

  /** Form helpers — `form.submit()` triggers the journey's next step. */
  export let form: StageFormObject;

  /** Bound to the underlying <form> element for programmatic access. */
  export let formEl: HTMLFormElement | null = null;

  /** Journey-level state — includes `loading` flag and navigation helpers. */
  export let journey: StageJourneyObject;

  /** Step + callback metadata from AM — policies, derived helpers, stage header. */
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;

  /** The raw JourneyStep from Journey Client — contains all callbacks for this step. */
  export let step: JourneyStep;

  // Subscribe to style store so the template can pass styles to child callbacks.
  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((v) => (currentStyle = v));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;

  /**
   * Auto-submits the form when the step declares itself self-submittable
   * (e.g. a DeviceProfile or PollingWait callback that needs no user input).
   */
  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  onMount(() => {
    // In modal mode, intercept anchor clicks to navigate within the journey
    // instead of performing a full page navigation.
    if (componentStyle === 'modal') {
      captureLinks(linkWrapper, journey);
    }
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<!--
  Replace or extend the markup below to customise the stage layout.
  The key pieces to keep:
    1. <Form> wrapper with `onSubmitWhenValid` bound to `form.submit`
    2. The {#each} block that maps callbacks via <CallbackMapper>
    3. A submit <Button> (unless the step is fully self-submittable)
-->
<Form bind:formEl ariaDescribedBy="__COMPONENT_SLUG__FailureAlert" onSubmitWhenValid={form?.submit}>
  {#if componentStyle !== 'inline'}
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <T key="loginHeader" />
    </h1>
  {/if}

  {#if form?.message}
    <Alert id="__COMPONENT_SLUG__FailureAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

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

  {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="loginButton" />
    </Button>
  {/if}

  {#if componentStyle !== 'inline'}
    <p
      bind:this={linkWrapper}
      class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="dontHaveAnAccount" html={true} />
    </p>
  {/if}
</Form>

<!--
  Scoped styles for this stage.
  These styles only apply to this component — they won't leak to the rest of the widget.
  You can also use Tailwind utility classes (prefixed with `tw_`) in the markup above.
-->
<style>
  /* Add your custom stage styles here. */
</style>
