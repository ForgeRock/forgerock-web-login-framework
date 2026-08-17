<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Input from './stacked-label.svelte';

  interface Props {
    checkValidity?: ((event: Event) => boolean) | null;
    message: string;
    isRequired: boolean;
    key: string;
    label: string;
    onChange: () => void;
    placeholder: string;
    withForm?: boolean;
    value: string;
  }

  let {
    checkValidity = null,
    message = $bindable(),
    isRequired,
    key,
    label,
    onChange,
    placeholder,
    withForm = false,
    value
  }: Props = $props();

  let wrapperEl: HTMLDivElement = $state();
  let isInvalid: boolean = $state();

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
    <Form ariaDescribedBy="stackedLabelInputStory" onSubmitWhenValid={submitForm}>
      <Input
        {checkValidity}
        isFirstInvalidInput={false}
        {isRequired}
        {isInvalid}
        {key}
        {label}
        {message}
        {onChange}
        {placeholder}
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
      {placeholder}
      {value}
    />
  {/if}
</div>
