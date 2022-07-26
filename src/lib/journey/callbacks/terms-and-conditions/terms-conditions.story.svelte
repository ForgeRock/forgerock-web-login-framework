<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import { initializeContent } from '$lib/locale.store';
  import Terms from './terms-conditions.svelte';

  export let callback: TermsAndConditionsCallback;
  export let inputName: string;

  initializeContent();
</script>

<Centered>
  <Terms {callback} {inputName} />
</Centered>
