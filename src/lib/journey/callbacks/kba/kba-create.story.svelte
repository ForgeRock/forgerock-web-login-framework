<script lang="ts">
  import type { KbaCreateCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Kba from './kba-create.svelte';

  export let callback: KbaCreateCallback;
  export let inputName: string;
</script>

<Centered>
  <Kba {callback} {inputName} />
</Centered>
