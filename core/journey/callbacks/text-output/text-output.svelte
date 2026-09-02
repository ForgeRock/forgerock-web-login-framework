<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import sanitize from 'xss';

  import Alert from '$components/primitives/alert/alert.svelte';
  import Text from '$components/primitives/text/text.svelte';

  import type {
    SuspendedTextOutputCallback,
    TextOutputCallback,
  } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const prevents errors in console
  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: SuspendedTextOutputCallback | TextOutputCallback;
  export let style: z.infer<typeof styleSchema> = {};

  let dirtyMessage = callback.getMessage();
  let cleanMessage = sanitize(dirtyMessage);
  let callbackMessageType: 'error' | 'info' | 'success' | 'warning' | '' = 'info';
  let hideMessage = false;

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
    const messageType = callback.getMessageType();
    dirtyMessage = callback.getMessage();
    cleanMessage = sanitize(dirtyMessage);
    callbackMessageType = getCallbackMessage(messageType);
    hideMessage = messageType === '4' && style.callbacks?.textOutput?.script === 'hidden';
  }
</script>

{#if !hideMessage}
  {#if callbackMessageType === 'info'}
    <Text classes={cleanMessage.length < 100 ? 'tw_font-bold tw_mt-6' : 'tw_mt-6'}>
      {@html cleanMessage}
    </Text>
  {:else}
    <Alert id="" needsFocus={false} type={callbackMessageType}>
      {cleanMessage}
    </Alert>
  {/if}
{/if}
