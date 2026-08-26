<!--
  @component
  Type: stage
  Name: DefaultLogin

  DEMO COMPONENT
  ──────────────
  Copy this file into experimental/custom/stages/<your-name>/ to create your
  own stage override or extension, then rebuild with `pnpm build:widget`.

  HOW OVERRIDES WORK
  ──────────────────
  Setting `Name: DefaultLogin` makes this component replace the built-in
  DefaultLogin stage renderer. The framework's Vite plugin writes
  custom-registry.ts on every build (and watches in dev), mapping:

    "DefaultLogin" → this component

  map-stage.utilities.ts checks that registry before the built-in switch, so
  this component takes over the full form layout for every step whose AM stage
  name is "DefaultLogin".

  HOW EXTENSIONS WORK
  ───────────────────
  Set `Name:` to a stage name that does not exist in the built-in set
  (e.g. `Name: MyBrandedLogin`). The widget renders this component whenever an
  AM step reports that stage name. You control stage names via the AM journey
  editor — any string value configured there is valid.
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

<Form bind:formEl ariaDescribedBy="customFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <div class="header-container">
    <div class="custom-login-icon" aria-hidden="true">
      <span class="custom-login-icon-symbol">✦</span>
    </div>

    <h1 class="custom-login-heading">
      <span class="custom-login-heading-text">Sign In</span>
    </h1>

    <p class="custom-login-subtitle">
      {interpolate('customLoginSubtitle', null, 'Welcome back, please sign in to continue.')}
    </p>
  </div>

  {#if form?.message}
    <Alert id="customFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
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

  {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <button class="signin-button" disabled={journey?.loading} type="submit">
      {journey?.loading ? 'Signing in…' : 'Continue'}
    </button>
  {/if}

  <p class="custom-login-footer">
    New here? <a href="?journey=Registration">Sign up!</a>
  </p>
</Form>

<style>
  .header-container {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .custom-login-icon {
    align-items: center;
    background-color: #7f91b7;
    border-radius: 9999px;
    display: flex;
    height: 4rem;
    justify-content: center;
    width: 4rem;
  }

  .custom-login-icon-symbol {
    color: #fff;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    user-select: none;
  }

  .custom-login-heading {
    color: #334155;
    font-size: var(--font-size, 1.5rem);
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .custom-login-heading-text {
    display: block;
  }

  .custom-login-subtitle {
    color: var(--color, hsl(210 15% 44%));
    font-size: 0.875rem;
    margin: 0;
    text-align: center;
  }

  .custom-login-footer {
    color: var(--color, hsl(210 15% 44%));
    font-size: 1rem;
    margin: 0;
    padding-bottom: 1rem;
    padding-top: 1rem;
    text-align: center;
  }

  .signin-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1.5;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .signin-button:hover:not(:disabled),
  .signin-button:focus-visible:not(:disabled) {
    background-color: #01699f;
    border-color: #01699f;
  }

  .signin-button:focus-visible {
    outline: 2px solid #027ab8;
    outline-offset: 2px;
  }

  .signin-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
