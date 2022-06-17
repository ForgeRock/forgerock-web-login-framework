<script lang="ts">
  export let defaultOption: number = null;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: number | null; text: string }[];
</script>

<div class={`tw_mb-3 tw_relative`}>
  <select
    class="tw_input-base dark:tw_input-base_dark tw_focusable-element tw_select-base dark:tw_select-base_dark tw_select-floating tw_w-full"
    id={key}
    name="selected"
    on:change={onChange}
    required={isRequired}
  >
    {#each options as option, idx}
      <option value={option.value ? option.value : ''} selected={idx === defaultOption}>
        {option.text}
      </option>
    {/each}
  </select>
  <label
    class="tw_absolute tw_h-full tw_input-floating-label tw_select-floating-label tw_input-label dark:tw_input-label_dark tw_left-0 tw_origin-top-left tw_p-3 tw_scale-90 tw_translate-x-0.5 tw_-translate-y-2.5 tw_top-1"
    for={key}>{label}</label
  >
</div>
