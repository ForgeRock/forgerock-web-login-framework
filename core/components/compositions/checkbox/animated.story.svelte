<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Checkbox from './animated.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let message = '';
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;
  export let withForm = false;

  let wrapperEl: HTMLDivElement;
  let isInvalid: boolean;

  function submitForm() {
    console.log('Form submitted');
    message = 'Please accept this';
  }

  onMount(() => {
    if (!withForm && message) {
      // Only done to force an error without any user interaction
      const errorEl = wrapperEl?.querySelector('input');
      errorEl?.setAttribute('aria-invalid', 'true');
      isInvalid = true;
    }
  });

  $: {
    console.log(message);
  }
</script>

<div bind:this={wrapperEl}>
  {#if withForm}
    <Form ariaDescribedBy="animatedCheckboxStory" onSubmitWhenValid={submitForm}>
      <Checkbox
        {checkValidity}
        isFirstInvalidInput={false}
        {isInvalid}
        isRequired={true}
        {key}
        {message}
        {onChange}
        {value}
      >
        {label}
      </Checkbox>
      <Button style="primary">Trigger Error</Button>
    </Form>
  {:else}
    <Checkbox
      {checkValidity}
      isFirstInvalidInput={false}
      {isInvalid}
      {key}
      {message}
      {onChange}
      {value}
    >
      {label}
    </Checkbox>
  {/if}
</div>
