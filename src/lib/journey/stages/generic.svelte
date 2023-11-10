<script lang="ts">
  import { FRAuth, FRStep } from '@forgerock/javascript-sdk';
  import { afterUpdate, onMount } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import {
    convertStringToKey,
    shouldRedirectFromStep,
  } from '$journey/stages/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import Sanitize from '$components/_utilities/server-strings.svelte';
  import ShieldIcon from '$components/icons/shield-icon.svelte';
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
  <!--
    The below condition follows this logic to render the submit button:
    - If the step is NOT self-submittable, render button (needed for steps with device profile and other callbacks)
    - If the user input calbacks are optional, render button (steps with self-submittable callbacks, but are optional)
    - If no self-submittable callbacks, render button (most generic steps)
  -->
  {#if !metadata?.step?.derived.isStepSelfSubmittable()}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {:else if metadata?.step?.derived.isUserInputOptional}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {:else if !metadata?.step?.derived.numOfSelfSubmittableCbs}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {/if}

  <BackTo {journey} />
</Form>
