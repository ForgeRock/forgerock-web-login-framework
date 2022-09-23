<script lang="ts">
  import type { FRCallback } from '@forgerock/javascript-sdk';

  export let callback: FRCallback;

  const type = callback.getType();
</script>

<p>Unknown callback encountered: {type}. Please contact support.</p>
