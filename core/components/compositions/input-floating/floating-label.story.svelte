<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Input from './floating-label.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let message: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let withForm = false;
  export let value: string;

  let wrapperEl: HTMLDivElement;
  let isInvalid: boolean;

  function submitForm() {
    message = 'This field must have a value';
  }

  onMount(() => {
    if (!withForm && message) {
      // Only done to force an error without any user interaction
      const errorEl = wrapperEl?.querySelector('input');
      errorEl?.setAttribute('aria-invalid', 'true');
      isInvalid = true;
    }
  });
</script>

<div bind:this={wrapperEl}>
  {#if withForm}
    <Form ariaDescribedBy="floatingLabelInputStory" onSubmitWhenValid={submitForm}>
      <Input
        {checkValidity}
        isFirstInvalidInput={false}
        {isRequired}
        {isInvalid}
        {key}
        {label}
        {message}
        {onChange}
        {value}
      />
      <Button style="primary">Trigger Error</Button>
    </Form>
  {:else}
    <Input
      {checkValidity}
      isFirstInvalidInput={false}
      {isRequired}
      {isInvalid}
      {key}
      {label}
      {message}
      {onChange}
      {value}
    />
  {/if}
</div>
