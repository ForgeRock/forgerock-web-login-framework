<script lang="ts">
  import type { PollingWaitCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const style: z.infer<typeof styleSchema> = {};
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: PollingWaitCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let options: Maybe<{ inline: boolean }> = null;

  let message: string;
  let timer: ReturnType<typeof setTimeout>;

  $: {
    callback = callback as PollingWaitCallback;
    message = callback.getMessage();

    // Clear any existing timeouts to avoid duplicates
    clearTimeout(timer);

    // Create new timeout, now that the previous has been cleared
    timer = setTimeout(() => {
      if (callbackMetadata) {
        callbackMetadata.derived.isReadyForSubmission = true;
      }
      selfSubmitFunction && selfSubmitFunction();
    }, callback.getWaitTime());
  }
</script>

<div class="tw_text-center">
  {#if options?.inline}
    <Text>
      <Spinner colorClass="white" layoutClasses="tw_h-4 tw_w-4 tw_mr-2" />
      <span>{message}</span>
    </Text>
  {:else}
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
    <Text>{message}</Text>
  {/if}
</div>
