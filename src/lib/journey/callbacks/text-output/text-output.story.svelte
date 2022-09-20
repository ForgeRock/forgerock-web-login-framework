<script lang="ts">
  import type { ConfirmationCallback, TextOutputCallback } from '@forgerock/javascript-sdk';

  import TextOutput from './text-output.svelte';

  export let callback: TextOutputCallback;
  export let choice: ConfirmationCallback;
</script>

<TextOutput {callback} {choice} />
