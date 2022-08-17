<script lang="ts">
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Password from './password.svelte';

  export let callback: PasswordCallback;
</script>

<Centered>
  <Password {callback} firstInvalidInput={false} idx={0} />
</Centered>
