<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { callbackType } from '@forgerock/journey-client';
  import { afterUpdate } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  // Import components
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  // i18n
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { styleStore as style } from '$core/style.store';
  import CallbackMapper from '$journey/_utilities/callback-mapper.svelte';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

  import type {
    BaseCallback,
    ConfirmationCallback,
    JourneyStep,
  } from '@forgerock/journey-client/types';

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

  let alertNeedsFocus = false;
  let buttons: { value: string; text: string }[];
  let formMessageKey = '';
  let modifiedCallbacks: BaseCallback[] = [];

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

    const confirmationCallbacks = step.getCallbacksOfType(callbackType.ConfirmationCallback);
    if (confirmationCallbacks.length) {
      const confirmationCb = confirmationCallbacks[0] as ConfirmationCallback;
      buttons = confirmationCb
        .getOptions()
        .map((option: string, index: number) => ({ value: `${index}`, text: option }));
    }

    /**
     * Filter out ConfirmationCallbacks; we'll use them seperately
     */
    modifiedCallbacks = step.callbacks.filter((callback: BaseCallback) => {
      if (callback.getType() === callbackType.ConfirmationCallback) {
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
