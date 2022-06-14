<script lang="ts">
  export let key;
  export let onChange;
  export let value;
</script>

<!--
  NOTE: The below wrapper is creating a grid, setting the first column to 1.5em
  and the second column as one flexible unit (1fr).
-->
<div class="tw_grid tw_grid-cols-[1.5em_1fr]">
  <input class="tw_checkbox-input tw_focusable-element" checked={value} id={key} on:change={onChange} type="checkbox" />
  <label for={key} class="tw_checkbox-label">
    <slot />
  </label>
</div>
