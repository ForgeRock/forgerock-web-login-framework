<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Select from './stacked-label.svelte';
  import Form from '$components/primitives/form/form.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let defaultOption: string | null = null;
  export let errorMessage: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: string; text: string }[];
  export let withForm = false;

  let wrapperEl: HTMLDivElement;
  let isInvalid: boolean;

  function submitForm() {
    errorMessage = 'Please select an option';
  }

  onMount(() => {
    if (!withForm && errorMessage) {
      // Only done to force an error without any user interaction
      const errorEl = wrapperEl?.querySelector('select');
      errorEl?.setAttribute('aria-invalid', 'true');
      isInvalid = true;
    }
  });
</script>

<div bind:this={wrapperEl}>
  {#if withForm}
    <Form ariaDescribedBy="StackedLabelSelectStory" onSubmitWhenValid={submitForm}>
      <Select
        {checkValidity}
        {defaultOption}
        isFirstInvalidInput={false}
        {isRequired}
        {isInvalid}
        {key}
        {label}
        message={errorMessage}
        {onChange}
        {options}
      />
      <Button style="primary">Trigger Error</Button>
    </Form>
  {:else}
    <Select
      {checkValidity}
      {defaultOption}
      isFirstInvalidInput={false}
      {isRequired}
      {isInvalid}
      {key}
      {label}
      message={errorMessage}
      {onChange}
      {options}
    />
  {/if}
</div>
