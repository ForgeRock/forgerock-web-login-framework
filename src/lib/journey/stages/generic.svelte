<script lang="ts">
  import { FRAuth, type FRCallback } from '@forgerock/javascript-sdk';
  import { afterUpdate } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import {
    convertStringToKey,
    initCheckValidation,
    shouldRedirectFromStep,
  } from '$journey/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import Sanitize from '$components/_utilities/server-strings.svelte';
  import ShieldIcon from '$components/icons/shield-icon.svelte';
  import { style } from '$lib/style.store';

  // Types
  import type { Maybe } from '$lib/interfaces';
  import type { CallbackMetadata, StepMetadata, WidgetStep } from '$journey/journey.interfaces';

  export let displayIcon: boolean;
  export let failureMessage: Maybe<string>;
  export let formEl: HTMLFormElement | null = null;
  export let loading: boolean;
  export let step: WidgetStep;
  export let submitForm: () => void;

  const formFailureMessageId = 'genericStepFailureMessage';
  const formHeaderId = 'genericStepHeader';
  const formElementId = 'genericStepForm';

  let alertNeedsFocus = false;
  let callbackMetadataArray: CallbackMetadata[] = [];
  let checkValidation: (callback: FRCallback) => boolean;
  let failureMessageKey = '';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let stepMetadata: StepMetadata;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal, first self-submittable cb to call this wins.
    if (stepMetadata.isStepSelfSubmittable) {
      submitFormWrapper();
    }
  }
  function submitFormWrapper() {
    alertNeedsFocus = false;
    formNeedsFocus = false;

    submitForm();
  }

  afterUpdate(() => {
    if (failureMessage) {
      formAriaDescriptor = formFailureMessageId;
      alertNeedsFocus = true;
      formNeedsFocus = false;
    } else {
      formAriaDescriptor = formHeaderId;
      alertNeedsFocus = false;
      formNeedsFocus = true;
    }
  });

  $: {
    shouldRedirectFromStep(step) && FRAuth.redirect(step);
    console.log(formNeedsFocus);
    checkValidation = initCheckValidation();
    callbackMetadataArray = buildCallbackMetadata(step, checkValidation);
    stepMetadata = buildStepMetadata(callbackMetadataArray);
    failureMessageKey = convertStringToKey(failureMessage);
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy={formAriaDescriptor}
  id={formElementId}
  needsFocus={formNeedsFocus}
  onSubmitWhenValid={submitFormWrapper}
>
  {#if displayIcon}
    <div class="tw_flex tw_justify-center">
      <ShieldIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}
  <header id={formHeaderId}>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <Sanitize html={true} string={step?.getHeader() || ''} />
    </h1>
    <p
      class="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <Sanitize html={true} string={step?.getDescription() || ''} />
    </p>
  </header>

  {#if failureMessage}
    <Alert id={formFailureMessageId} needsFocus={alertNeedsFocus} type="error">
      {interpolate(failureMessageKey, null, failureMessage)}
    </Alert>
  {/if}

  {#each step?.callbacks as callback, idx}
    <svelte:component
      this={mapCallbackToComponent(callback)}
      {callback}
      callbackMetadata={callbackMetadataArray[idx]}
      selfSubmitFunction={determineSubmission}
      {step}
      stepMetadata={{ ...stepMetadata }}
      style={$style}
    />
  {/each}

  {#if stepMetadata.isUserInputOptional || !stepMetadata.isStepSelfSubmittable}
    <Button busy={loading} style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {/if}
</Form>
