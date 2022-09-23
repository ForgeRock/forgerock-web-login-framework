<script lang="ts">
  import type { Maybe } from '$lib/interfaces';

  export let message: string;
  export let key: Maybe<string> = undefined;
  export let showMessage: Maybe<boolean> = true;
  export let type: 'info' | 'error' = 'info';

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
</script>

{#if message}
  <p
    class={`__input-message ${!showMessage ? 'tw_hidden' : ''} ${generateClassString(type)}`}
    id={`${key ? `${key}-message` : ''}`}
  >
    {message}
  </p>
{/if}
