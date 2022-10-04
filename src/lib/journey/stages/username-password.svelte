<script lang="ts">
  import { afterUpdate } from 'svelte';
  import type { FRStep, FRCallback } from '@forgerock/javascript-sdk';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import components
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { convertStringToKey } from '$journey/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import { style } from '$lib/style.store';

  // Types
  import type { Maybe } from '$lib/interfaces';
  import type { WidgetStep } from '$journey/journey.interfaces';

  export let displayIcon: boolean;
  export let failureMessage: Maybe<string>;
  export let formEl: HTMLFormElement | null = null;
  export let loading: boolean;
  export let step: WidgetStep;
  export let submitForm: () => void;

  let alertNeedsFocus = false;
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

  afterUpdate(() => {
    if (failureMessage && !hasPrevError) {
      alertNeedsFocus = true;
    }
  });

  $: {
    failureMessageKey = convertStringToKey(failureMessage);
  }
</script>

{#if displayIcon}
  <div class="tw_flex tw_justify-center">
    <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
  </div>
{/if}
<h1 class="tw_primary-header dark:tw_primary-header_dark">
  <T key="loginHeader" />
</h1>

<Form bind:formEl onSubmitWhenValid={submitForm}>
  {#if failureMessage}
    <Alert type="error" needsFocus={alertNeedsFocus}
      >{interpolate(failureMessageKey, null, failureMessage)}</Alert
    >
  {/if}
  {#each step?.callbacks as callback, idx}
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
    <T key="loginButton" />
  </Button>
  <p
    class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
  >
    <T key="dontHaveAnAccount" html={true} />
  </p>
</Form>
