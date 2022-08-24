<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Choice from './choice.svelte';

  export let callback: ChoiceCallback;
</script>

<Centered>
  <Choice {callback} firstInvalidInput={false} idx={0} />
</Centered>
