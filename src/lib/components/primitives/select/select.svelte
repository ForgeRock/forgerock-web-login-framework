<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Label from '$components/primitives/label/label.svelte';

  export let selectClasses = '';
  export let defaultOption: number | null = null;
  export let firstInvalidInput: boolean;
  export let isRequired: boolean;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let labelClasses = '';
  export let labelOrder: 'first' | 'last' = 'first';
  export let onChange: (event: Event) => void;
  export let options: { value: string | null; text: string }[];

  let inputEl: HTMLSelectElement;

  afterUpdate(() => {
    if (firstInvalidInput) {
      inputEl.focus();
    }
  });
</script>

{#if labelOrder === 'first'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}

<select
  aria-invalid={isInvalid}
  bind:this={inputEl}
  class={`${selectClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_select-base dark:tw_select-base_dark tw_w-full`}
  data-message={`${key}-message`}
  id={key}
  on:change={onChange}
  required={isRequired}
>
  {#each options as option}
    <option value={option.value ? option.value : ''} selected={option.value === defaultOption}>
      {option.text}
    </option>
  {/each}
</select>

{#if labelOrder === 'last'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}
