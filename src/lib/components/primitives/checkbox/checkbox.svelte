<script lang="ts">
  import Label from "$components/primitives/label/label.svelte";

  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;
</script>

<input
  aria-invalid={isInvalid}
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
