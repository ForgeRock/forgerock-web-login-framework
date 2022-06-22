<script lang="ts">
  import Select from '$components/primitives/select/select.svelte';

  export let defaultOption: number = null;
  export let errorMessage = '';
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: () => void;
  export let options: { value: number | null; text: string }[];
</script>

<div class={`tw_mb-3 tw_relative`}>
  <Select
    {defaultOption}
    {isRequired}
    {key}
    {label}
    labelClasses="tw_absolute tw_h-full tw_input-floating-label tw_select-floating-label tw_left-0 tw_origin-top-left tw_p-3 tw_scale-90 tw_translate-x-0.5 tw_-translate-y-2.5 tw_top-1"
    labelOrder="last"
    {onChange}
    {options}
    selectClasses="tw_select-floating"
  />
  <p class="tw_input-error-message dark:tw_input-error-message_dark">{errorMessage}</p>
</div>
