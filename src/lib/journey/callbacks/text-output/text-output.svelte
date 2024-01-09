<script lang="ts">
  import type { SuspendedTextOutputCallback, TextOutputCallback } from '@forgerock/javascript-sdk';
  import sanitize from 'xss';
  import type { z } from 'zod';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';
  import Alert from '$components/primitives/alert/alert.svelte';
  import Text from '$components/primitives/text/text.svelte';

  // Unused props. Setting to const prevents errors in console
  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};

  export let callback: SuspendedTextOutputCallback | TextOutputCallback;

  let dirtyMessage = callback.getMessage();
  let cleanMessage = sanitize(dirtyMessage);
  let callbackMessageType: 'error' | 'info' | 'success' | 'warning' | '' = 'info';

  function getCallbackMessage(messageType: string) {
    switch (messageType) {
      case '0':
        return 'info';
      case '1':
        return 'warning';
      case '2':
        return 'error';
      default:
        return 'info';
    }
  }

  $: {
    dirtyMessage = callback.getMessage();
    cleanMessage = sanitize(dirtyMessage);
    callbackMessageType = getCallbackMessage(callback.getMessageType());
  }
</script>

{#if callbackMessageType === 'info'}
  <Text classes={cleanMessage.length < 100 ? 'tw_font-bold tw_mt-6' : 'tw_mt-6'}>
    {@html cleanMessage}
  </Text>
{:else}
  <Alert id="" needsFocus={false} type={callbackMessageType}>
    {cleanMessage}
  </Alert>
{/if}
