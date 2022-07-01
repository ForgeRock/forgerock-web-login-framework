<script lang="ts">
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Checkbox from './boolean.svelte';

  export let callback: AttributeInputCallback<boolean>;
  export let inputName: string;
</script>

<Centered>
  <Checkbox {callback} {inputName} />
</Centered>
