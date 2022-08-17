<script lang="ts">
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './string-attribute-input.svelte';

  export let callback: AttributeInputCallback<string>;
</script>

<Centered>
  <Input {callback} firstInvalidInput={false} idx={0} />
</Centered>
