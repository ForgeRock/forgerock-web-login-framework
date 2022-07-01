<script lang="ts">
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Password from './password.svelte';

  export let callback: PasswordCallback;
  export let inputName: string;
</script>

<Centered>
  <Password {callback} {inputName} />
</Centered>
