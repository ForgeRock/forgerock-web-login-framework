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

  export let callback: PollingWaitCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  let message: string;
  let time: number;

  $: {
    message = callback.getMessage();
    time = callback.getWaitTime();
    setTimeout(() => {
      callbackMetadata.isReadyForSubmission = true;
      selfSubmitFunction && selfSubmitFunction();
    }, time);
  }
</script>

<div class="tw_text-center">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
  <Text>{message}</Text>
</div>
