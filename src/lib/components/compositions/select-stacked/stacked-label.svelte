<script lang="ts">
  import Select from '$components/primitives/select/select.svelte';

  export let defaultOption: number = null;
  export let errorMessage = '';
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let options: { value: number | null; text: string }[];
</script>

<div class="tw_mb-3">
  <Select
    {defaultOption}
    {key}
    {label}
    labelClasses="tw_input-stacked-label"
    labelOrder="first"
    {onChange}
    {options}
    {isRequired}
  />
  <p class="tw_input-error-message dark:tw_input-error-message_dark">{errorMessage}</p>
</div>
