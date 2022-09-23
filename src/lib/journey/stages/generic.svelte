<script lang="ts">
  import type { FRCallback } from '@forgerock/javascript-sdk';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { convertStringToKey } from '$journey/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Sanitize from '$components/_utilities/server-strings.svelte';

  // Types
  import type { Maybe } from '$lib/interfaces';
  import type { StepTypes } from '$journey/journey.interfaces';

  export let failureMessage: Maybe<string>;
  export let formEl: HTMLFormElement | null = null;
  export let loading: boolean;
  export let step: StepTypes;
  export let submitForm: () => void;

  let failureMessageKey = '';
  let hasPrevError = false;

  // TODO: Pull out and rework into a utility or helper
  function checkValidation(callback: FRCallback) {
    let failedPolices = callback.getOutputByName('failedPolicies', []);
    if (failedPolices.length && !hasPrevError) {
      hasPrevError = true;
      return true;
    }
    return false;
  }

  $: {
    failureMessageKey = convertStringToKey(failureMessage);
  }
</script>

<Form bind:formEl onSubmitWhenValid={submitForm}>
  {#if !step}
    <div class="tw_text-center tw_w-full tw_py-4">
      <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
    </div>
  {:else if step.type === 'Step'}
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <!-- TODO: Needs localization strategy -->
      <Sanitize html={true} string={step.getHeader() || ''} />
    </h1>
    <p
      class="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <!-- TODO: Needs localization strategy -->
      <Sanitize html={true} string={step.getDescription() || ''} />
    </p>
    {#if failureMessage}
      <Alert type="error">{interpolate(failureMessageKey, null, failureMessage)}</Alert>
    {/if}
    {#each step?.callbacks as callback, idx}
      {@const firstInvalidInput = checkValidation(callback)}
      <svelte:component
        this={mapCallbackToComponent(callback)}
        {callback}
        {firstInvalidInput}
        {idx}
      />
    {/each}
    <Button busy={loading} style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {/if}
</Form>
