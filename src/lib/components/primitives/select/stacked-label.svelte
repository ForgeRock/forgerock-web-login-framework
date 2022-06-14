
<script lang="ts">
  export let defaultOption;
  export let key;
  export let label;
  export let onChange;
  export let options;
  export let width: 'full' | 'half' = 'full';</script>

<div class="tw_mb-3">
  <label class="tw_input-stacked-label" for={key}>{label}</label>
  <select
    on:change={onChange}
    id={key}
    name="selected"
    class={`tw_input-base tw_focusable-element tw_select-base width-${width} tw_p-3`}
  >
    {#each options as option, idx}
      <option value={idx} selected={idx === defaultOption}>
        {option}
      </option>
    {/each}
  </select>
</div>

<style>
  .width-full {
    @apply tw_w-full;
  }
  .width-half {
    @apply tw_w-1/2;
  }
</style>
