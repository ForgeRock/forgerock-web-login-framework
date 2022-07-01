<script lang="ts">
  import { onMount } from 'svelte';
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './validated-create-username.svelte';

  export let callback: ValidatedCreateUsernameCallback;
  export let inputName: string;
  export let showError: boolean;
</script>

<Centered>
  <Input {callback} {inputName} />
</Centered>
