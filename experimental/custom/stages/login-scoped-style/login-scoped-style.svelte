<!--
  @component
  Type: stage
  Name: LoginScopedStyle

  DEMO COMPONENT — scoped theme-style override
  ───────────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Demonstrates that a
  component's own <style> block wins over the widget's theme (styleStore) —
  the submit button uses a hardcoded gradient/brand look that a tenant's
  theme colors cannot override, since scoped styles take final precedence.
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
  ariaDescribedBy="scopedStyleFormFailureMessageAlert"
  onSubmitWhenValid={form?.submit}
>
  <h1 class="scoped-style-heading">Sign In</h1>

  {#if form?.message}
    <Alert id="scopedStyleFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
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

  <!--
    Scoped styles below always win over the theme injected via styleStore —
    this button ignores currentStyle entirely and uses its own gradient.
  -->
  <button class="brand-gradient-button" disabled={journey?.loading} type="submit">
    {journey?.loading ? 'Signing in…' : 'Sign In'}
  </button>
</Form>

<style>
  .scoped-style-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .brand-gradient-button {
    background: linear-gradient(90deg, #7c3aed, #db2777);
    border: none;
    border-radius: 0.5rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .brand-gradient-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
