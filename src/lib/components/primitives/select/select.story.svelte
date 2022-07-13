<script lang="ts">
  import Select from './select.svelte';

  export let defaultOption: number;
  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let labelOrder: 'first' | 'last' | null;
  export let onChange: (event: Event) => void;
  export let options: { text: string, value: number }[];
</script>

<div>
  <Select {defaultOption} {isRequired} {key} {label} {labelOrder} {onChange} {options} />
</div>
