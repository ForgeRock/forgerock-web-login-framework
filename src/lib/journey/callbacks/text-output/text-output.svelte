<script lang="ts">
  import type { SuspendedTextOutputCallback, TextOutputCallback } from '@forgerock/javascript-sdk';
  import sanitize from 'xss';
  import type { z } from 'zod';

  import Text from '$components/primitives/text/text.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};

  export let callback: SuspendedTextOutputCallback | TextOutputCallback;

  let dirtyMessage = callback.getMessage();
  let cleanMessage = sanitize(dirtyMessage);

  $: {
    dirtyMessage = callback.getMessage();
    cleanMessage = sanitize(dirtyMessage);
  }
</script>

<Text classes="tw_font-bold tw_mt-6">
  {@html cleanMessage}
</Text>
