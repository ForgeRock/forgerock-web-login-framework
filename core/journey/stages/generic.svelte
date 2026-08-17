<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import Sanitize from '$components/_utilities/server-strings.svelte';
  import ShieldIcon from '$components/icons/shield-icon.svelte';
  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  // i18n
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { encodeCssUrl } from '$core/_utilities/theme.utilities';
  import { styleStore } from '$core/style.store';
  import CallbackMapper from '$journey/_utilities/callback-mapper.svelte';
  import {
    convertStringToKey,
    shouldRedirectFromStep,
  } from '$journey/stages/_utilities/step.utilities';
  import BackTo from './_utilities/back-to.svelte';
  import { captureLinks } from './_utilities/stage.utilities';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  // Types
  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  }>;
  export let step: JourneyStep;

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
    if (shouldRedirectFromStep(step)) {
      journey.redirect(step);
    }
  }

  $: {
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
  {#if $styleStore?.logo && componentStyle !== 'modal'}
    <div class="tw_flex tw_justify-center tw_pb-4">
      <div
        class="tw_dialog-logo dark:tw_dialog-logo_dark"
        style={`--logo-light: ${encodeCssUrl(
          $styleStore.logo.light ?? '',
        )}; --logo-dark: ${encodeCssUrl($styleStore.logo.dark ?? '')}; height: ${
          $styleStore.logo.height ? `${$styleStore.logo.height}px` : '72px'
        }; width: ${$styleStore.logo.width ? `${$styleStore.logo.width}px` : '200px'};`}
      ></div>
    </div>
  {:else if form?.icon && componentStyle !== 'inline'}
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
