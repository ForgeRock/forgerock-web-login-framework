<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import sanitize from 'xss';

  import type { Maybe } from '$core/interfaces';

  interface Props {
    classes?: string;
    dirtyMessage: string;
    key?: Maybe<string>;
    showMessage?: Maybe<boolean>;
    type?: 'info' | 'error';
  }

  let {
    classes = '',
    dirtyMessage,
    key = undefined,
    showMessage = true,
    type = 'info'
  }: Props = $props();

  let cleanMessage = $state(sanitize(dirtyMessage));

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

  run(() => {
    cleanMessage = sanitize(dirtyMessage);
  });
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
