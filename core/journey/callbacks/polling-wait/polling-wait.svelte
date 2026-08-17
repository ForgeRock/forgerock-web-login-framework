<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';

  import type { PollingWaitCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const prevents errors in console
  export const style: z.infer<typeof styleSchema> = {};
  export const stepMetadata: Maybe<StepMetadata> = null;

  interface Props {
    callback: PollingWaitCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    selfSubmitFunction?: Maybe<SelfSubmitFunction>;
    options?: Maybe<{ inline: boolean }>;
  }

  let {
    callback = $bindable(),
    callbackMetadata = $bindable(),
    selfSubmitFunction = null,
    options = null,
  }: Props = $props();

  let message: string | undefined = $state();
  let timer: ReturnType<typeof setTimeout> = $state();

  $effect.pre(() => {
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
  });
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
