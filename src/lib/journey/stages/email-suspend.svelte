<script lang="ts">
  import { FRAuth, FRStep } from '@forgerock/javascript-sdk';
  import { afterUpdate, onMount } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import {
    convertStringToKey,
    shouldRedirectFromStep,
  } from '$journey/stages/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import Sanitize from '$components/_utilities/server-strings.svelte';
  import EmailIcon from '$components/icons/email-icon.svelte';
  import { styleStore } from '$lib/style.store';

  // Types
  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import BackTo from './_utilities/back-to.svelte';
  import { captureLinks } from './_utilities/stage.utilities';
  import type { Maybe } from '$lib/interfaces';
  import CallbackMapper from '$journey/_utilities/callback-mapper.svelte';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  }>;
  export let step: FRStep;

  const formFailureMessageId = 'genericStepFailureMessage';
  const formHeaderId = 'genericStepHeader';
  const formElementId = 'genericStepForm';

  let alertNeedsFocus = false;
  let formMessageKey = '';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let linkWrapper: HTMLElement;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal, first self-submittable cb to call this wins.
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
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
  {#if form?.icon && componentStyle !== 'inline'}
    <div class="tw_flex tw_justify-center">
      <EmailIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}

  <header bind:this={linkWrapper} id={formHeaderId}>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <Sanitize html={true} string={step?.getHeader() || interpolate('checkYourEmail')} />
    </h1>
  </header>

  {#if form?.message}
    <Alert id={formFailureMessageId} needsFocus={alertNeedsFocus} type="error">
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
        style: $styleStore,
      }}
    />
  {/each}

  <BackTo {journey} />
</Form>
