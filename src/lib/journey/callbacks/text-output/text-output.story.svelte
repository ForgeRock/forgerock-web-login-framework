<script lang="ts">
  import type { ConfirmationCallback, TextOutputCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import TextOutput from './text-output.svelte';

  export let callback: TextOutputCallback;
</script>

<Centered>
  <TextOutput {callback} />
</Centered>
