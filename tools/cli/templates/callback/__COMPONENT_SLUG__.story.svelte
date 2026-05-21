<!--
  Story wrapper for the __COMPONENT_NAME__ callback. Mounts the component
  with default metadata so it can render in isolation inside Storybook.
-->

<script lang="ts">
  import {
    type BaseCallback,
    type CallbackMetadata,
    Centered,
    type Maybe,
    type SelfSubmitFunction,
    type StepMetadata,
    type StyleObject,
  } from '$login-framework';
  import __COMPONENT_NAME_PASCAL__ from './__COMPONENT_SLUG__.svelte';

  export let callback: BaseCallback;
  export let callbackMetadata: Maybe<CallbackMetadata> = undefined;
  export let style: StyleObject = {};
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: Maybe<StepMetadata> = null;

  const defaultCallbackMetadata: CallbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
      isPasskeyAutofillEligible: false,
    },
    idx: 0,
  };

  const defaultStepMetadata: StepMetadata = {
    derived: {
      isStepSelfSubmittable: () => false,
      isUserInputOptional: false,
      numOfCallbacks: 1,
      numOfSelfSubmittableCbs: 0,
      numOfUserInputCbs: 1,
    },
  };

  $: mergedCallbackMetadata = { ...defaultCallbackMetadata, ...callbackMetadata };
  $: mergedStepMetadata = stepMetadata ?? defaultStepMetadata;
</script>

<Centered>
  <svelte:component
    this={__COMPONENT_NAME_PASCAL__}
    {callback}
    callbackMetadata={mergedCallbackMetadata}
    {style}
    {selfSubmitFunction}
    stepMetadata={mergedStepMetadata}
  />
</Centered>
