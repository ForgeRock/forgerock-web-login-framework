<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Choice from './choice.svelte';

  export let callback: ChoiceCallback;
  export let inputName: string;
</script>

<Centered>
  <Choice {callback} {inputName} />
</Centered>
