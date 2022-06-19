<script lang="ts">
  import Label from './label.svelte';

  export let key: string;
  export let classes: string;
</script>

<Label {key} {classes}>Input Label</Label>
