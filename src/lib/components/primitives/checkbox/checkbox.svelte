<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Label from '$components/primitives/label/label.svelte';

  export let isFirstInvalidInput: boolean;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;

  let inputEl: HTMLInputElement;

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });
</script>

<input
  aria-describedby={`${key}-message`}
  aria-invalid={isInvalid}
  bind:this={inputEl}
  class="tw_checkbox-input dark:tw_checkbox-input_dark tw_focusable-element dark:tw_focusable-element_dark"
  checked={value}
  id={key}
  on:change={onChange}
  required={isRequired}
  type="checkbox"
/>
<Label {key}>
  <slot />
</Label>
