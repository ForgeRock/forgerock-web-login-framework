<!--
  @component
  Type: stage
  Name: OtpMfaStartOver

  DEMO COMPONENT — OTP MFA with restart
  ──────────────────────────────────────
  Extension stage for an OTP MFA journey. It renders AM callbacks through
  CallbackMapper and restarts the active journey without hard-coding its name.
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

  import type {
    BaseCallback,
    ConfirmationCallback,
    JourneyStep,
  } from '@forgerock/journey-client/types';

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
  let buttons: { value: string; text: string }[] = [];
  let formMessageKey = '';
  let modifiedCallbacks: { callback: BaseCallback; originalIndex: number }[] = [];

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  async function restartCurrentJourney() {
    await journey.restartCurrent();
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);

    const confirmationCallback = step?.callbacks.find(
      (callback) => callback.getType() === 'ConfirmationCallback',
    ) as ConfirmationCallback | undefined;
    buttons = confirmationCallback
      ? confirmationCallback
          .getOptions()
          .map((option: string, index: number) => ({ value: `${index}`, text: option }))
      : [];

    modifiedCallbacks = (step?.callbacks ?? [])
      .map((callback, originalIndex) => ({ callback, originalIndex }))
      .filter(({ callback }) => callback.getType() !== 'ConfirmationCallback');
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy="otpMfaStartOverFailureMessageAlert"
  onSubmitWhenValid={form?.submit}
>
  <h1 class="otp-heading">2-Step verification to verify it's you</h1>
  <p class="otp-supporting-text">
    We've sent an 8-digit verification code to your email. Please enter it below. It's valid for 5
    minutes.
  </p>

  {#if form?.message}
    <Alert id="otpMfaStartOverFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#each modifiedCallbacks as { callback, originalIndex }}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[originalIndex],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  {#if buttons.length}
    <button class="submit-button" disabled={journey?.loading} type="submit">Continue</button>
  {:else if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <button class="submit-button" disabled={journey?.loading} type="submit">Continue</button>
  {/if}

  <p class="start-over">
    <button
      class="start-over-button"
      disabled={journey?.loading}
      on:click={restartCurrentJourney}
      type="button"
    >
      Start over
    </button>
  </p>
</Form>

<style>
  .otp-heading {
    color: #334155;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 300;
    margin-bottom: 1rem;
    text-align: center;
  }

  .otp-supporting-text {
    color: #374151;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.875rem;
    line-height: 1.25;
    margin-bottom: 0.5rem;
    margin-top: -1.25rem;
    padding-bottom: 1rem;
    padding-top: 1rem;
    text-align: center;
  }

  .submit-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.9375rem;
    line-height: 1.5;
    padding: 0.75rem 1.5rem;
    position: relative;
    text-align: center;
    width: 100%;
  }

  .submit-button:hover:not(:disabled),
  .submit-button:focus-visible:not(:disabled) {
    background-color: #01699f;
    border-color: #01699f;
  }

  .submit-button:focus-visible,
  .start-over-button:focus-visible {
    outline: 3px solid rgb(2 122 184 / 10%);
    outline-offset: 2px;
  }

  .submit-button:disabled,
  .start-over-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .start-over {
    margin: 1rem 0;
    text-align: center;
  }

  .start-over-button {
    background: none;
    border: 0;
    color: #2563eb;
    cursor: pointer;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.9375rem;
    padding: 0;
    text-decoration: underline;
  }

  .start-over-button:hover:not(:disabled) {
    text-decoration: none;
  }

  :global(.dark) .otp-heading,
  :global(.dark) .otp-supporting-text {
    color: #d1d5db;
  }

  :global(.dark) .start-over-button {
    color: #60a5fa;
  }
</style>
