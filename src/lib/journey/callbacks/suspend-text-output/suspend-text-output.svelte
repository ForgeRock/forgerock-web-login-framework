<script lang="ts">
  import type { SuspendedTextOutputCallback } from '@forgerock/javascript-sdk';

  export let callback: SuspendedTextOutputCallback;

  const message = callback.getMessage();
</script>

<p class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light">
  {message}
</p>
