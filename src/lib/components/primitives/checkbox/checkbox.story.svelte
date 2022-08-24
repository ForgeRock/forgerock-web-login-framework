<script lang="ts">
  import Checkbox from './checkbox.svelte';

  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;
</script>

<div>
  <Checkbox {key} {onChange} {value}>
    {label}
  </Checkbox>
</div>
