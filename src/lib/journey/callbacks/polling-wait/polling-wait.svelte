<script lang="ts">
  import type { PollingWaitCallback } from '@forgerock/javascript-sdk';

  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: Style = {};

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;

  let message: string;
  let time: number;
  let typedCallback: PollingWaitCallback

  $: {
    typedCallback = callback as PollingWaitCallback;
    message = typedCallback.getMessage();
    time = typedCallback.getWaitTime();
    setTimeout(() => {
      if (callbackMetadata) { callbackMetadata.isReadyForSubmission = true; }
      selfSubmitFunction && selfSubmitFunction();
    }, time);
  }
</script>

<div class="tw_text-center">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
  <Text>{message}</Text>
</div>
