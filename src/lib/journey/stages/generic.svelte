<script lang="ts">
  import type { FRLoginFailure, FRLoginSuccess, FRStep } from '@forgerock/javascript-sdk';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import T from '$components/i18n/index.svelte';
  import { mapCallbackToComponent } from '$journey/utilities/map-callback.utilities';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
import { interpolate } from '$lib/utilities/i18n.utilities';
import { convertStringToKey } from '$journey/utilities/callback.utilities';

  type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;

  export let failureMessage: string;
  export let formEl: HTMLFormElement | null = null;
  export let step: StepTypes;
  export let submitForm: () => void;

  let failureMessageKey = '';

  $: {
    failureMessageKey = convertStringToKey(failureMessage);
  }
</script>

{#if !step}
  <div class="tw_text-center tw_w-full tw_py-4">
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
  </div>
{:else if step.type === 'Step'}
  <h1 class="tw_primary-header dark:tw_primary-header_dark">
    <!-- TODO: Needs localization strategy -->
    {step.getHeader() || ''}
  </h1>
  <Form bind:formEl onSubmitWhenValid={submitForm}>
    {#if failureMessage}
      <Alert type="error">{interpolate(failureMessageKey, null, failureMessage)}</Alert>
    {/if}
    {#each step?.callbacks as callback, idx}
       <svelte:component this={mapCallbackToComponent(callback)} {callback} {idx} />
    {/each}
    <Button width="full" style="primary" type="submit">
      <T key="nextButton" />
    </Button>
  </Form>
{:else if step.type === 'LoginSuccess'}
  <T key="successMessage" />
{/if}
