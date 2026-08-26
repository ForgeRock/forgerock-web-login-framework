<!--
  @component
  Type: stage
  Name: LoginTwoColumn

  DEMO COMPONENT — two-column HTML layout
  ─────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Demonstrates
  rearranging the form into a CSS-grid two-column layout: a left column with
  a brand/marketing panel, a right column with the actual login fields.
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

<div class="two-column-layout">
  <div class="brand-panel">
    <h2>Welcome back</h2>
    <p>Sign in to pick up right where you left off.</p>
  </div>

  <div class="form-panel">
    <Form
      bind:formEl
      ariaDescribedBy="twoColumnFormFailureMessageAlert"
      onSubmitWhenValid={form?.submit}
    >
      <h1 class="form-heading">Sign In</h1>

      {#if form?.message}
        <Alert id="twoColumnFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
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

      <button class="signin-button" disabled={journey?.loading} type="submit">
        {journey?.loading ? 'Signing in…' : 'Sign In'}
      </button>
    </Form>
  </div>
</div>

<style>
  .two-column-layout {
    display: grid;
    gap: 4rem;
    grid-template-columns: 1fr 1fr;
  }

  .brand-panel {
    align-items: center;
    background-color: #931fec;
    border-radius: 0.5rem;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .form-panel {
    display: flex;
    flex-direction: column;
  }

  .form-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
  }

  .signin-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .signin-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
