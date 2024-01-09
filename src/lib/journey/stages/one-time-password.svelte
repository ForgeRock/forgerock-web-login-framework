<script lang="ts">
  import {
    CallbackType,
    ConfirmationCallback,
    type FRCallback,
    type FRStep,
  } from '@forgerock/javascript-sdk';
  import { afterUpdate } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import components
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  import { styleStore as style } from '$lib/style.store';

  // Types
  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$journey/journey.interfaces';
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

  let alertNeedsFocus = false;
  let buttons: { value: string; text: string }[];
  let formMessageKey = '';
  let modifiedCallbacks: FRCallback[] = [];

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal first self-submittable cb to call this wins.
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);

    const confirmationCallbacks = step.getCallbacksOfType(CallbackType.ConfirmationCallback);
    if (confirmationCallbacks.length) {
      const confirmationCb = confirmationCallbacks[0] as ConfirmationCallback;
      buttons = confirmationCb
        .getOptions()
        .map((option, index) => ({ value: `${index}`, text: option }));
    }

    /**
     * Filter out ConfirmationCallbacks; we'll use them seperately
     */
    modifiedCallbacks = step.callbacks.filter((callback) => {
      if (callback.getType() === CallbackType.ConfirmationCallback) {
        return false;
      }
      return true;
    });
  }
</script>

<Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  {#if componentStyle !== 'inline'}
    {#if form?.icon}
      <div class="tw_flex tw_justify-center">
        <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
      </div>
    {/if}
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <T key="twoFactorAuthentication" />
    </h1>
    <p
      class="tw_text-center tw_text-sm tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="useTheAuthenticatorAppOnYourPhone" />
    </p>
  {/if}

  {#if form?.message}
    <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#each modifiedCallbacks as callback, idx}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[idx],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: $style,
      }}
    />
  {/each}

  {#if buttons?.length}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key={buttons[0].text} />
    </Button>
  {:else if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="loginButton" />
    </Button>
  {/if}
</Form>
