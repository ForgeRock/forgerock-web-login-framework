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

  interface Props {
    callback: BaseCallback;
    callbackMetadata?: Maybe<CallbackMetadata>;
    style?: StyleObject;
    selfSubmitFunction?: Maybe<SelfSubmitFunction>;
    stepMetadata?: Maybe<StepMetadata>;
  }

  let {
    callback,
    callbackMetadata = undefined,
    style = {},
    selfSubmitFunction = null,
    stepMetadata = null,
  }: Props = $props();

  const defaultCallbackMetadata: CallbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
      autocompleteValues: undefined,
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

  let mergedCallbackMetadata = $derived({ ...defaultCallbackMetadata, ...callbackMetadata });
  let mergedStepMetadata = $derived(stepMetadata ?? defaultStepMetadata);
</script>

<Centered>
  {@const SvelteComponent = __COMPONENT_NAME_PASCAL__}
  <SvelteComponent
    {callback}
    callbackMetadata={mergedCallbackMetadata}
    {style}
    {selfSubmitFunction}
    stepMetadata={mergedStepMetadata}
  />
</Centered>
