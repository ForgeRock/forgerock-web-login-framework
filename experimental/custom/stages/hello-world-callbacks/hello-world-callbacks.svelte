<!--
@component
Type: stage
Name: HelloWorldCallbacks

DEMO COMPONENT — Step 3: AM callbacks
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import { CallbackMapper, Form, styleStore } from '$login-framework';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <h1 class="tutorial-heading">Hello World!</h1>
  <p class="tutorial-description">
    CallbackMapper renders fields supplied by your AM journey step.
  </p>

  {#each step?.callbacks as callback, index}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[index],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
</Form>

<style>
  .tutorial-heading {
    color: #334155;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 300;
    margin-bottom: 1rem;
    text-align: center;
  }

  .tutorial-description {
    color: #374151;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
