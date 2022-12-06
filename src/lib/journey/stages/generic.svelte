<script lang="ts">
  import { FRAuth, type FRCallback } from '@forgerock/javascript-sdk';
  import { afterUpdate, onMount } from 'svelte';

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
  import type { CallbackMetadata, StageFormObject, StageJourneyObject, StepMetadata, WidgetStep } from '$journey/journey.interfaces';
  import BackTo from './_utilities/back-to.svelte';
  import { captureLinks } from './_utilities/stage.utilities';

 // New API
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let step: WidgetStep;

  const formFailureMessageId = 'genericStepFailureMessage';
  const formHeaderId = 'genericStepHeader';
  const formElementId = 'genericStepForm';

  let alertNeedsFocus = false;
  let callbackMetadataArray: CallbackMetadata[] = [];
  let checkValidation: (callback: FRCallback) => boolean;
  let formMessageKey = '';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let linkWrapper: HTMLElement;
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

    form?.submit();
  }

  afterUpdate(() => {
    if (form?.message) {
      formAriaDescriptor = formFailureMessageId;
      alertNeedsFocus = true;
      formNeedsFocus = false;
    } else {
      formAriaDescriptor = formHeaderId;
      alertNeedsFocus = false;
      formNeedsFocus = true;
    }
  });

  onMount(() => captureLinks(linkWrapper, journey));

  $: {
    shouldRedirectFromStep(step) && FRAuth.redirect(step);
    checkValidation = initCheckValidation();
    callbackMetadataArray = buildCallbackMetadata(step, checkValidation);
    stepMetadata = buildStepMetadata(callbackMetadataArray);
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy={formAriaDescriptor}
  id={formElementId}
  needsFocus={formNeedsFocus}
  onSubmitWhenValid={submitFormWrapper}
>
  {#if form?.icon}
    <div class="tw_flex tw_justify-center">
      <ShieldIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}
  <header bind:this={linkWrapper} id={formHeaderId}>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <Sanitize html={true} string={step?.getHeader() || ''} />
    </h1>
    <p
      class="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <Sanitize html={true} string={step?.getDescription() || ''} />
    </p>
  </header>

  {#if form?.message}
    <Alert id={formFailureMessageId} needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
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
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {/if}

  <BackTo {journey} />
</Form>
