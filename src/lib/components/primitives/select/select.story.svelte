<script lang="ts">
  import Select from './select.svelte';

  export let defaultOption: string;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let labelOrder: 'first' | 'last' | undefined;
  export let onChange: (event: Event) => void;
  export let options: { text: string; value: string }[];
</script>

<div>
  <Select
    {defaultOption}
    {isRequired}
    firstInvalidInput={false}
    {key}
    {label}
    {labelOrder}
    {onChange}
    {options}
  />
</div>
