<script lang="ts">
  import { onMount } from 'svelte';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';


  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './string-attribute-input.svelte';

  export let callback: AttributeInputCallback<string>;
  export let inputName: string;
  export let showError: boolean;
</script>

<Centered>
  <Input {callback} {inputName} />
</Centered>
