<script lang="ts">
  export let key: string;
  export let onChange: (event: Event) => void;
  export let value: string;
</script>

<!--
  NOTE: The below wrapper is creating a grid, setting the first column to 1.5em
  and the second column as one flexible unit (1fr).
-->
<div class="tw_grid tw_grid-cols-[1.5em_1fr]">
  <input class="tw_checkbox-input dark:tw_checkbox-input_dark tw_focusable-element dark:tw_focusable-element_dark" checked={value} id={key} on:change={onChange} type="checkbox" />
  <label for={key} class="tw_checkbox-label dark:tw_checkbox-label_dark">
    <slot />
  </label>
</div>
