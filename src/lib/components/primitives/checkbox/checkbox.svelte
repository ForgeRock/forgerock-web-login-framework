<script lang="ts">
  export let key;
  export let onChange;
  export let value;
</script>

<div class="tw_block tw_mb-4 tw_pl-6">
  <input
    class="tw_inline-block tw_-ml-6 tw_mt-1 tw_align-top"
    checked={value}
    id={key}
    on:change={onChange}
    type="checkbox"
  />
  <label for={key} class="tw_inline-block">
    <slot />
  </label>
</div>
