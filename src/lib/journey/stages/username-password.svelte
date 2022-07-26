<script lang="ts">
  import type { FRLoginFailure, FRLoginSuccess, FRStep } from '@forgerock/javascript-sdk';
  import type { Writable } from 'svelte/store';

  // i18n
  import T from '$components/i18n/index.svelte';

  // Import primitives
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  import { mapCallbackToComponent } from '$journey/utilities/map-callback.utilities';
  import Spinner from '$components/primitives/spinner/spinner.svelte';

  type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;

  export let formEl: HTMLFormElement | null = null;
  export let step: StepTypes;
  export let submitForm: () => void;
</script>

<div class="tw_flex tw_justify-center">
  <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
</div>
<h1 class="tw_primary-header dark:tw_primary-header_dark">
  <T key="loginHeader" />
</h1>

{#if !step}
  <div class="tw_text-center tw_w-full tw_py-4">
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
  </div>
{:else if step.type === 'Step'}
  <Form bind:formEl onSubmitWhenValid={submitForm}>
    {#each step?.callbacks as callback, idx}
      <svelte:component this={mapCallbackToComponent(callback)} {callback} {idx} />
    {/each}
    <Button width="full" style="primary" type="submit">
      <T key="loginButton" />
    </Button>
  </Form>
  <p class="tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light">
    <T key="dontHaveAnAccount" html={true} />
  </p>
{:else if step.type === 'LoginSuccess'}
  <T key="loginSucess" />
{/if}
