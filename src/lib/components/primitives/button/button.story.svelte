<script lang="ts">
  /* eslint @typescript-eslint/no-empty-function: "off" */
  import Button from './button.svelte';

  // Button props
  export let busy = false;
  // export let customCss = [];
  export let onClick = (event: Event) => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let text: string;
  export let type: 'button' | 'submit' | null = null;
  export let width: 'auto' | 'full' = 'auto';

  // initialize({ button: customCss });
</script>

<Button {busy} {onClick} {style} {type} {width}>
  {text}
</Button>
