<script lang="ts">
  export let defaultOption: number = null;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: number | null; text: string }[];
</script>

<div class="tw_mb-3">
  <label class="tw_input-label dark:tw_input-label_dark tw_input-stacked-label" for={key}>{label}</label>
  <select
    class={`tw_input-base dark:tw_input-base_dark tw_focusable-element tw_select-base dark:tw_select-base_dark tw_p-3 tw_w-full`}
    id={key}
    on:change={onChange}
    name="selected"
    required={isRequired}
  >
  {#each options as option, idx}
    <option value={option.value ? option.value : ''} selected={idx === defaultOption}>
      {option.text}
    </option>
  {/each}
  </select>
</div>
