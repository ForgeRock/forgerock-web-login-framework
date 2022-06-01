<script lang="ts">
  import Checkbox from "./checkbox.svelte";

  export let key: string;
  export let label: string;
  export let onChange: string;
  export let value: boolean;
</script>

<Checkbox {key} {onChange} {value}>
  {label}
</Checkbox>
