<script lang="ts">
  import type { HiddenValueCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import HiddenValue from './hidden-value.svelte';

  export let callback: HiddenValueCallback;
</script>

<Centered>
  <HiddenValue {callback} firstInvalidInput={false} idx={0} />
</Centered>
