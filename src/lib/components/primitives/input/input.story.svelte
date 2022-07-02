<script lang="ts">
  import Input from './input.svelte';

  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let labelOrder: 'first' | 'last' | null;
  export let onChange: (event: Event) => void;
  export let placeholder: string;
</script>

<div>
  <Input {isRequired} {key} {label} {labelOrder} {onChange} {placeholder} />
</div>
