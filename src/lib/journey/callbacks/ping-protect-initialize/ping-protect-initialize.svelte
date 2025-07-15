<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';
  import type { z } from 'zod';
  import type { PingOneProtectInitializeCallback } from '@forgerock/javascript-sdk';
  import { PIProtect } from '@forgerock/ping-protect';

  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import type { SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export const style: z.infer<typeof styleSchema> = {};
  export const stepMetadata: Maybe<StepMetadata> = null;
  export let callback: PingOneProtectInitializeCallback;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  let loaded = false;

  onMount(() => {
    async function loadingPingProtect() {
      const config = callback.getConfig();
      try {
        await PIProtect.start(config);
        loaded = true;
      } catch (error) {
        if (error instanceof Error) {
          callback.setClientError(error.message);
        } else {
          callback.setClientError('An error occurred while initializing PingProtect');
        }
      }
      return selfSubmitFunction && selfSubmitFunction();
    }
    loadingPingProtect();
  });
</script>

<div>
  {#if !loaded}
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
  {/if}
</div>
