<script lang="ts">
  import type { FRLoginFailure, FRLoginSuccess, FRStep } from '@forgerock/javascript-sdk';
  import type { Writable } from 'svelte/store';

  // Import primitives
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Link from '$components/primitives/link/link.svelte';
  import NewUserIcon from '$components/icons/new-user-icon.svelte';
  import { mapCallbackToComponent } from '$journey/utilities/map-callback.utilities';

  type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;

  export let formEl: HTMLFormElement | null = null;
  export let step: Writable<StepTypes>;
  export let submitForm: () => void;
</script>

<div class="tw_flex tw_justify-center">
  <NewUserIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
</div>
<h1 class="tw_primary-header dark:tw_primary-header_dark">Sign Up</h1>
<p
  class="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
>
  Already have an account? <Link href="/">Sign in here!</Link>
</p>

{#if !$step}
  <p>Loading ...</p>
{:else if $step.type === 'Step'}
  <Form bind:formEl onSubmitWhenValid={submitForm}>
    {#each $step?.callbacks as callback}
      <!--
         Using @const to save off the inputName for easier readability.
         Then, using the dynamic svelte component syntax to pull logic out of the
         template and into the JS above for assigning the right component to the
         callback.
       -->
      {@const inputName = callback?.payload?.input?.[0].name}
      <svelte:component this={mapCallbackToComponent(callback)} {callback} {inputName} />
    {/each}
    <Button width="full" style="primary" type="submit">Submit</Button>
  </Form>
{:else if $step.type === 'LoginSuccess'}
  <p>Login Success!</p>
{/if}
