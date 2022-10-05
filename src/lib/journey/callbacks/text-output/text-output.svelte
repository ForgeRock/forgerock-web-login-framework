<script lang="ts">
  import type { SuspendedTextOutputCallback, TextOutputCallback } from '@forgerock/javascript-sdk';
  import sanitize from 'xss';

  export let callback: SuspendedTextOutputCallback | TextOutputCallback;

  let dirtyMessage = callback.getMessage();
  let cleanMessage = sanitize(dirtyMessage);

  $: {
    dirtyMessage = callback.getMessage();
    cleanMessage = sanitize(dirtyMessage);
  }
</script>

<p class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light">
  {@html cleanMessage}
</p>
