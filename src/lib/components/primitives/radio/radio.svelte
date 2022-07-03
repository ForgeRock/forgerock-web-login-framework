<script lang="ts">
  import Label from '../label/label.svelte';

  export let checked = false;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let value: number;
</script>

<input
  aria-invalid={isInvalid}
  class="tw_checkbox-input dark:tw_checkbox-input_dark tw_focusable-element dark:tw_focusable-element_dark"
  {checked}
  id={key}
  {name}
  on:change={onChange}
  required={isRequired}
  type="radio"
  {value}
/>
<Label {key}>
  <slot />
</Label>
