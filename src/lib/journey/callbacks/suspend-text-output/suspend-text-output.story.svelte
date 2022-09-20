<script lang="ts">
  import type { ConfirmationCallback, TextOutputCallback } from '@forgerock/javascript-sdk';

  import SuspendTextOutput from './suspend-text-output.svelte';

  export let callback: TextOutputCallback;
  export let choice: ConfirmationCallback;
</script>

<SuspendTextOutput {callback} {choice} />
