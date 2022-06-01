<script lang="ts">
  import Button from "./button.svelte";

  // Button props
  export let busy = false;
  export let onClick = (event: Event) => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let text: string;
  export let type: 'button' | 'submit' = null;
  export let width: 'auto' | 'full' | 'half' = 'auto';
</script>

<Button {busy} {onClick} {style} {type} {width}>
  {text}
</Button>
