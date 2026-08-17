<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Checkbox from './animated.svelte';

  interface Props {
    checkValidity?: ((event: Event) => boolean) | null;
    message?: string;
    key: string;
    label: string;
    onChange: (event: Event) => void;
    value: boolean;
    withForm?: boolean;
  }

  let {
    checkValidity = null,
    message = $bindable(),
    key,
    label,
    onChange,
    value,
    withForm = false,
  }: Props = $props();

  let wrapperEl: HTMLDivElement | undefined = $state();
  let isInvalid: boolean | undefined = $state();

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

  $effect.pre(() => {
    console.log(message);
  });
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
