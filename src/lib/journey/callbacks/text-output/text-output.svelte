<script lang="ts">
  import type { SuspendedTextOutputCallback, TextOutputCallback } from '@forgerock/javascript-sdk';
  import sanitize from 'xss';

  import Text from '$components/primitives/text/text.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: SuspendedTextOutputCallback | TextOutputCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

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
