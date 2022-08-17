<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Name from './name.svelte';

  export let callback: NameCallback;
</script>

<Centered>
  <Name {callback} firstInvalidInput={false} idx={0} />
</Centered>
