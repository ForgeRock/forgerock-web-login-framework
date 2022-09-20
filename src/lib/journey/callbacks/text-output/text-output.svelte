<script lang="ts">
  import type { ConfirmationCallback, TextOutputCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';
  import Button from '$components/primitives/button/button.svelte';

  export let callback: TextOutputCallback;
  export let choice: ConfirmationCallback;

  const options = choice.getOptions();
  $: selected = choice.getDefaultOption(); // gets the index position

  const message = callback.getMessage();

  function setValue(index: number) {
    selected = index;
  }
</script>

<Centered>
  <div>{message}</div>
  {#each options as opt, index}
    <Button
      style={selected === index ? 'primary' : 'secondary'}
      type="button"
      width="auto"
      onClick={() => setValue(index)}
    >
      {opt}
    </Button>
  {/each}
</Centered>
