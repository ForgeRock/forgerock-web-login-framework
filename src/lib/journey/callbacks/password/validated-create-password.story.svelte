<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './validated-create-password.svelte';

  export let callback: ValidatedCreatePasswordCallback;
</script>

<Centered>
  <Input {callback} firstInvalidInput={false} idx={0} />
</Centered>
