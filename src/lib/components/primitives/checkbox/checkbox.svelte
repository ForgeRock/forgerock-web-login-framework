<script lang="ts">
  export let isRequired = false;
  export let isInvalid: boolean = null;
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
<label for={key} class="tw_checkbox-label dark:tw_checkbox-label_dark">
  <slot />
</label>
