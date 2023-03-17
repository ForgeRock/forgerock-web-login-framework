<script lang="ts">
  import sanitize from 'xss';
  import type { Maybe } from '$lib/interfaces';

  export let classes = '';
  export let dirtyMessage: string;
  export let key: Maybe<string> = undefined;
  export let showMessage: Maybe<boolean> = true;
  export let type: 'info' | 'error' = 'info';

  let cleanMessage = sanitize(dirtyMessage);

  function generateClassString(...args: string[]) {
    return args.reduce((prev, curr) => {
      switch (curr) {
        // Button style cases
        case 'error':
          return `${prev} tw_input-error-message dark:tw_input-error-message_dark`;
        default:
          return `${prev} tw_input-info-message dark:tw_input-info-message_dark`;
      }
    }, '');
  }

  $: {
    cleanMessage = sanitize(dirtyMessage);
  }
</script>

{#if dirtyMessage}
  <p
    class={`${classes} __input-message ${!showMessage ? 'tw_hidden' : ''} ${generateClassString(
      type,
    )}`}
    id={`${key ? `${key}-message` : ''}`}
  >
  {@html cleanMessage}
  </p>
{/if}
