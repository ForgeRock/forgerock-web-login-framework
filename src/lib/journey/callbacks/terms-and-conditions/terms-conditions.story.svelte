<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Terms from './terms-conditions.svelte';

  export let callback: TermsAndConditionsCallback;
</script>

<Centered>
  <Terms {callback} firstInvalidInput={false} idx={0} />
</Centered>
