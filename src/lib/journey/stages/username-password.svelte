<script lang="ts">
  import type { FRCallback } from '@forgerock/javascript-sdk';
  import { afterUpdate } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import components
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import {
    convertStringToKey,
    initCheckValidation,
  } from '$journey/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
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

  let alertNeedsFocus = false;
  let callbackMetadataArray: CallbackMetadata[] = [];
  let checkValidation: (callback: FRCallback) => boolean;
  let failureMessageKey = '';
  let stepMetadata: StepMetadata;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal first self-submittable cb to call this wins.
    if (stepMetadata.isStepSelfSubmittable) {
      submitForm();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = !!failureMessage;
  });

  $: {
    checkValidation = initCheckValidation();
    callbackMetadataArray = buildCallbackMetadata(step, checkValidation);
    stepMetadata = buildStepMetadata(callbackMetadataArray);
    failureMessageKey = convertStringToKey(failureMessage);
  }
</script>

<Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={submitForm}>
  {#if displayIcon}
    <div class="tw_flex tw_justify-center">
      <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}
  <h1 class="tw_primary-header dark:tw_primary-header_dark">
    <T key="loginHeader" />
  </h1>

  {#if failureMessage}
    <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(failureMessageKey, null, failureMessage)}
    </Alert>
  {/if}

  {#each step?.callbacks as callback, idx}
    <svelte:component
      this={mapCallbackToComponent(callback)}
      {callback}
      callbackMetadata={callbackMetadataArray[idx]}
      selfSubmitFunction={determineSubmission}
      stepMetadata={{ ...stepMetadata }}
      style={$style}
    />
  {/each}

  {#if !stepMetadata.isStepSelfSubmittable}
    <Button busy={loading} style="primary" type="submit" width="full">
      <T key="loginButton" />
    </Button>
  {/if}

  <p
    class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
  >
    <T key="dontHaveAnAccount" html={true} />
  </p>
</Form>
