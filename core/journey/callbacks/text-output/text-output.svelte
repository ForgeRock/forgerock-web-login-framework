<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';
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
  export const style: z.infer<typeof styleSchema> = {};

  interface Props {
    callback: SuspendedTextOutputCallback | TextOutputCallback;
  }

  let { callback }: Props = $props();

  let dirtyMessage = $state(callback.getMessage());
  let cleanMessage = $state(sanitize(dirtyMessage));
  let callbackMessageType: 'error' | 'info' | 'success' | 'warning' | '' = $state('info');

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

  run(() => {
    dirtyMessage = callback.getMessage();
    cleanMessage = sanitize(dirtyMessage);
    callbackMessageType = getCallbackMessage(callback.getMessageType());
  });
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
