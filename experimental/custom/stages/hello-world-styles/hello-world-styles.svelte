<!--
@component
Type: stage
Name: HelloWorldStyles

DEMO COMPONENT — Step 4: scoped styles
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
  <section class="tutorial-card">
    <p class="tutorial-step">Step 4: scoped styles</p>
    <h1>Hello World!</h1>
    <p>Component-scoped CSS changes this stage without styling other journey steps.</p>

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
  </section>
</Form>

<style>
  .tutorial-card {
    background: #eff6ff;
    border: 1px solid #93c5fd;
    border-radius: 0.75rem;
    color: #1e3a8a;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    padding: 1.5rem;
  }

  .tutorial-step {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .tutorial-card h1 {
    font-size: 2rem;
    font-weight: 300;
    margin: 0 0 0.75rem;
  }

  .tutorial-card :global(.tw_input-base) {
    border-color: #60a5fa;
  }

  :global(.dark) .tutorial-card {
    background: #172554;
    border-color: #1d4ed8;
    color: #dbeafe;
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
