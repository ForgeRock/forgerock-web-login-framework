<script lang="ts">
  import type { FRCallback } from '@forgerock/javascript-sdk';
  import { afterUpdate, onMount } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import components
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { convertStringToKey, initCheckValidation } from '$journey/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import { style } from '$lib/style.store';

  // Types
  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    WidgetStep,
  } from '$journey/journey.interfaces';
  import { captureLinks } from './_utilities/stage.utilities';

  // New API
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let step: WidgetStep;

  let alertNeedsFocus = false;
  let callbackMetadataArray: CallbackMetadata[] = [];
  let checkValidation: (callback: FRCallback) => boolean;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;
  let stepMetadata: StepMetadata;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal first self-submittable cb to call this wins.
    if (stepMetadata.isStepSelfSubmittable) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  onMount(() => captureLinks(linkWrapper, journey));

  $: {
    checkValidation = initCheckValidation();
    callbackMetadataArray = buildCallbackMetadata(step, checkValidation);
    stepMetadata = buildStepMetadata(callbackMetadataArray);
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  {#if form?.icon}
    <div class="tw_flex tw_justify-center">
      <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}
  <h1 class="tw_primary-header dark:tw_primary-header_dark">
    <T key="loginHeader" />
  </h1>

  {#if form?.message}
    <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
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
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="loginButton" />
    </Button>
  {/if}

  <p class=" tw_my-4 tw_text-base tw_text-center tw_text-link-dark dark:tw_text-link-light">
    <button
      on:click|preventDefault={() => {
        journey.push({ tree: 'ResetPassword' });
      }}
    >
      {interpolate('forgotPassword', null, 'Forgot Password?')}
    </button>
    &nbsp;
    <button
      on:click|preventDefault={() => {
        journey.push({ tree: 'ForgottenUsername' });
      }}
    >
      {interpolate('forgotUsername', null, 'Forgot Username?')}
    </button>
  </p>

  <hr class="tw_border-0 tw_border-b tw_border-secondary-light dark:tw_border-secondary-dark" />

  <p
    bind:this={linkWrapper}
    class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
  >
    <T key="dontHaveAnAccount" html={true} />
  </p>
</Form>
