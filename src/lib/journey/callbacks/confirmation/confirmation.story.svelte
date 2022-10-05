<script lang="ts">
  import type { ConfirmationCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import TextOutput from './confirmation.svelte';

  export let callback: ConfirmationCallback;
</script>

<Centered>
  <TextOutput {callback} firstInvalidInput={false} idx={0} />
</Centered>
