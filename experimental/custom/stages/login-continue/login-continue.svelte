<!--
  @component
  Type: stage
  Name: LoginContinue

  DEMO COMPONENT — displayed-text change
  ─────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Identical to the
  base custom-login stage, but with the submit button relabeled "Continue"
  instead of "Sign In" — the smallest possible edit to show live-preview
  text changes in the editor.
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
  } from '$login-framework';

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

  let alertNeedsFocus = false;
  let formMessageKey = '';

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy="continueFormFailureMessageAlert"
  onSubmitWhenValid={form?.submit}
>
  <h1 class="continue-heading">Sign In</h1>

  {#if form?.message}
    <Alert id="continueFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
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
        style: currentStyle,
      }}
    />
  {/each}

  <button class="continue-button" disabled={journey?.loading} type="submit">
    {journey?.loading ? 'Continuing…' : 'Sign In'}
  </button>
</Form>

<style>
  .continue-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .continue-button {
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

  .continue-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
