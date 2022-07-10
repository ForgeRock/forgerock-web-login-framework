<script lang="ts">
  import type { FRLoginFailure, FRLoginSuccess, FRStep } from '@forgerock/javascript-sdk';
  import type { Writable } from 'svelte/store';

  // Import primitives
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';
  import Link from '$components/primitives/link/link.svelte';
  import { mapCallbackToComponent } from '$journey/utilities/map-callback.utilities';

  type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;

  export let formEl: HTMLFormElement | null = null;
  export let step: Writable<StepTypes>;
  export let submitForm: () => void;
</script>

<div class="tw_flex tw_justify-center">
  <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
</div>
<h1 class="tw_primary-header dark:tw_primary-header_dark">Sign In</h1>

{#if !$step}
  <p>Loading ...</p>
{:else if $step.type === 'Step'}
  <Form bind:formEl onSubmitWhenValid={submitForm}>
    {#each $step?.callbacks as callback, idx}
      <svelte:component this={mapCallbackToComponent(callback)} {callback} {idx} />
    {/each}
    <Button width="full" style="primary" type="submit">Submit</Button>
  </Form>
  <p class="tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light">
    Don’t have an account?
    <Link href="/register">Sign up here!</Link>
  </p>
{:else if $step.type === 'LoginSuccess'}
  <p>Login Success!</p>
{/if}
