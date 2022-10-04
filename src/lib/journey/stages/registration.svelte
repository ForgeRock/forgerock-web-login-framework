<script lang="ts">
  import type { FRStep, FRCallback } from '@forgerock/javascript-sdk';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { convertStringToKey } from '$journey/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import NewUserIcon from '$components/icons/new-user-icon.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import { style } from '$lib/style.store';

  import type { Maybe } from '$lib/interfaces';
  import type { WidgetStep } from '$journey/journey.interfaces';

  export let displayIcon: boolean;
  export let failureMessage: Maybe<string>;
  export let formEl: HTMLFormElement | null = null;
  export let loading: boolean;
  export let step: WidgetStep;
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

{#if displayIcon}
  <div class="tw_flex tw_justify-center">
    <NewUserIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
  </div>
{/if}
<h1 class="tw_primary-header dark:tw_primary-header_dark">
  <T key="registerHeader" />
</h1>
<p
  class="tw_text-base tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
>
  <T key="alreadyHaveAnAccount" html={true} />
</p>

<Form bind:formEl onSubmitWhenValid={submitForm}>
  {#if failureMessage}
    <Alert type="error">{interpolate(failureMessageKey, null, failureMessage)}</Alert>
  {/if}
  {#each step?.callbacks as callback, idx}
    <!-- TODO: Trying to minimize looping, but having it within template is a bit clunky -->
    {@const firstInvalidInput = checkValidation(callback)}
    <svelte:component
      this={mapCallbackToComponent(callback)}
      {callback}
      {idx}
      {firstInvalidInput}
      labelType={$style?.labels}
    />
  {/each}
  <Button busy={loading} style="primary" type="submit" width="full">
    <T key="registerButton" />
  </Button>
</Form>
