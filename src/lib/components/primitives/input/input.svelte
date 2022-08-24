<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Label from '$components/primitives/label/label.svelte';

  export let firstInvalidInput: boolean;
  export let inputClasses = '';
  export let key: string;
  export let label: string;
  export let labelClasses = '';
  export let labelOrder: 'first' | 'last' = 'first';
  export let onChange: (event: Event) => void;
  export let placeholder: string | null = null;
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value = '';

  let inputEl: HTMLInputElement;

  afterUpdate(() => {
    if (firstInvalidInput) {
      inputEl.focus();
    }
  });
</script>

{#if labelOrder === 'first'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}

<input
  aria-invalid={isInvalid}
  bind:this={inputEl}
  class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
  data-message={`${key}-message`}
  id={key}
  on:change={onChange}
  placeholder={placeholder || label}
  required={isRequired}
  {type}
  {value}
/>

{#if labelOrder === 'last'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}
