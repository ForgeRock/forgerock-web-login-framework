<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import { initialize } from '$lib/locale.store';
  import Terms from './terms-conditions.svelte';

  export let callback: TermsAndConditionsCallback;

  initialize();
</script>

<Centered>
  <Terms {callback} firstInvalidInput={false} idx={0} />
</Centered>
