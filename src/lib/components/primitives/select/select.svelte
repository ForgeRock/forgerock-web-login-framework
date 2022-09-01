<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Label from '$components/primitives/label/label.svelte';

  export let selectClasses = '';
  export let defaultOption: string | null = null;
  export let firstInvalidInput: boolean;
  export let isRequired: boolean;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let labelClasses = '';
  export let labelOrder: 'first' | 'last' = 'first';
  export let onChange: (event: Event) => void;
  export let options: { value: string; text: string }[];

  let inputEl: HTMLSelectElement;
  let shouldDisplayOption = true;

  /**
   * If label and option share the same text, only display option
  */
  if (defaultOption === null && (options[0].text === label)) {
    shouldDisplayOption = false;
  }

  afterUpdate(() => {
    if (firstInvalidInput) {
      inputEl.focus();
    }
  });

  function onChangeWrapper(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const selectedOption = options.find((option) => option.value === value);

    // Check if text is same as label
    shouldDisplayOption = !(label === selectedOption?.text);

    // Continue with calling onChange paramater
    onChange(event);
  }
</script>

{#if labelOrder === 'first'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}

<select
  aria-invalid={isInvalid}
  bind:this={inputEl}
  class={`${ shouldDisplayOption ? selectClasses : '' } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_select-base dark:tw_select-base_dark tw_w-full`}
  data-message={`${key}-message`}
  id={key}
  on:change={onChangeWrapper}
  required={isRequired}
>
  {#each options as option}
    <option value={option.value} selected={option.value === defaultOption}>
      {option.text}
    </option>
  {/each}
</select>

{#if labelOrder === 'last'}
  <Label {key} classes={`${ shouldDisplayOption ? labelClasses : 'tw_sr-only' }`}>{label}</Label>
{/if}
