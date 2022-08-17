<script lang="ts">
  import Input from './input.svelte';

  export let isRequired: boolean;
  export let key: string;
  export let label: string;
  export let labelOrder: 'first' | 'last' | undefined;
  export let onChange: (event: Event) => void;
  export let placeholder: string;
</script>

<div>
  <Input
    {isRequired}
    firstInvalidInput={false}
    {key}
    {label}
    {labelOrder}
    {onChange}
    {placeholder}
  />
</div>
