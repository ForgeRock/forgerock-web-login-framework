<script lang="ts">
  import type { KbaCreateCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Kba from './kba-create.svelte';

  export let callback: KbaCreateCallback;
</script>

<Centered>
  <Kba {callback} firstInvalidInput={false} idx={0} />
</Centered>
