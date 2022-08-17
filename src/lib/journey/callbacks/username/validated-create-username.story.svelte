<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './validated-create-username.svelte';

  export let callback: ValidatedCreateUsernameCallback;
</script>

<Centered>
  <Input {callback} firstInvalidInput={false} idx={0} />
</Centered>
