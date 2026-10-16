<!--
  Story wrapper for the __COMPONENT_NAME__ stage. Builds the metadata structure
  the stage expects and mounts the component inside <Centered> so it can render
  in isolation inside Storybook.
-->

<script lang="ts">
  import {
    buildCallbackMetadata,
    buildStepMetadata,
    Centered,
    initCheckValidation,
    initializeLinks,
    initializeStyles,
    type JourneyStep,
    type StageFormObject,
    type StageJourneyObject,
    type StyleObject,
  } from '$login-framework';
  import __COMPONENT_NAME_PASCAL__ from './__COMPONENT_SLUG__.svelte';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let step: JourneyStep;
  export let style: StyleObject = {};

  const callbackMetadata = buildCallbackMetadata(step, initCheckValidation());
  const stepMetadata = buildStepMetadata(callbackMetadata, undefined, step.getStage());
  const metadata = {
    callbacks: callbackMetadata,
    step: stepMetadata,
  };

  initializeLinks({ termsAndConditions: '/' });
  initializeStyles(style);
</script>

<Centered>
  <svelte:component
    this={__COMPONENT_NAME_PASCAL__}
    componentStyle="modal"
    {form}
    {journey}
    {metadata}
    {step}
  />
</Centered>
