<script lang="ts">
  import Label from './label.svelte';

  export let key: string;
  export let classes: string;
  export let inputLabel: string;
</script>

<Label {key} {classes}>
  {inputLabel}
</Label>
