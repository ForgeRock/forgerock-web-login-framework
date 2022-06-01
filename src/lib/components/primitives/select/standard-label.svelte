
<script lang="ts">
  export let defaultOption;
  export let key;
  export let label;
  export let onChange;
  export let options;
</script>

<div class="tw_mb-3">
  <label class="tw_h-full tw_font-bold tw_text-gray-dark" for={key}>{label}</label>
  <select
    on:change={onChange}
    id={key}
    name="selected"
    class="form-select tw_appearance-none tw-bg-white tw_block tw_border tw_border-gray tw_leading-4 tw_pl-3 tw_rounded tw_text-gray-dark tw_w-full"
  >
    {#each options as option, idx}
      <option value={idx} selected={idx === defaultOption}>
        {option}
      </option>
    {/each}
  </select>
</div>

<style>
  /* TODO: Make this more Tailwindy */
  .form-select {
    -moz-padding-start: calc(0.75rem - 3px);
    height: calc(3rem + 2px);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='gray' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right .75rem center;
    background-size: 16px 12px;
  }
</style>
