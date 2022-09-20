<script lang="ts">
  import type { SuspendedTextOutputCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  export let callback: SuspendedTextOutputCallback;

  const message = callback.getMessage();

</script>

<Centered>
  <div>{message}</div>
</Centered>
