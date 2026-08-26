<!--
  @component
  Type: stage
  Name: LoginValidation

  DEMO COMPONENT — behavioral field validation
  ─────────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Demonstrates adding
  custom client-side validation behavior on top of the standard login form:
  an extra "Confirmation code" field that must be exactly 6 digits, validated
  on blur, with an inline error message and a red border when invalid.
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

  // Local-only demo field — not part of the SDK callback chain, purely to
  // showcase custom validation behavior in the editor demo.
  let confirmationCode = '';
  let confirmationCodeTouched = false;
  let confirmationCodeError = '';

  function validateConfirmationCode() {
    confirmationCodeTouched = true;
    confirmationCodeError = /^\d{10}$/.test(confirmationCode) ? '' : 'Enter exactly 10 digits.';
  }

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
  ariaDescribedBy="validationFormFailureMessageAlert"
  onSubmitWhenValid={form?.submit}
>
  <h1 class="validation-heading">Sign In</h1>

  {#if form?.message}
    <Alert id="validationFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
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

  <label
    class="confirmation-field"
    class:has-error={confirmationCodeTouched && confirmationCodeError}
  >
    <span>Confirmation code</span>
    <input
      bind:value={confirmationCode}
      inputmode="numeric"
      maxlength="10"
      on:blur={validateConfirmationCode}
      placeholder="1234567890"
      type="text"
    />
    {#if confirmationCodeTouched && confirmationCodeError}
      <span class="confirmation-error">{confirmationCodeError}</span>
    {/if}
  </label>

  <button class="signin-button" disabled={journey?.loading} type="submit">
    {journey?.loading ? 'Signing in…' : 'Sign In'}
  </button>
</Form>

<style>
  .validation-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .confirmation-field {
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .confirmation-field input {
    border: 1px solid #cbd5e1;
    border-radius: 0.25rem;
    color: #334155;
    padding: 0.5rem 0.75rem;
  }

  .confirmation-field.has-error input {
    border-color: #dc2626;
  }

  .confirmation-error {
    color: #dc2626;
    font-size: 0.75rem;
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
