<script lang="ts">
  import Button from "./button.svelte";
  import { initStyles } from '$widget/styles.store';

  // Button props
  export let busy = false;
  export let customCss = [];
  export let onClick = (event: Event) => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let text: string;
  export let type: 'button' | 'submit' = null;
  export let width: 'auto' | 'full' | 'half' = 'auto';


  initStyles({ button: customCss });
</script>

<Button {busy} {onClick} {style} {type} {width}>
  {text}
</Button>
