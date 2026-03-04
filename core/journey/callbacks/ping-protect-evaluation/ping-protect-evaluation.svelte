<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';
  import T from '$components/_utilities/locale-strings.svelte';
  import type { PingOneProtectEvaluationCallback } from '@forgerock/javascript-sdk';
  import { PIProtect, type InitParams } from '@forgerock/ping-protect';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import type { SelfSubmitFunction } from '$journey/journey.interfaces';
  import type { Maybe } from '$core/interfaces';

  export let callback: PingOneProtectEvaluationCallback;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let pingProtect: InitParams = {
    envId: '',
  };

  let pauseBehavioralData = false;

  onMount(() => {
    async function handleGetData() {
      try {
        await PIProtect.getData();
      } catch (error) {
        if (error instanceof Error) {
          callback.setClientError(error.message);
        } else {
          callback.setClientError('An error occurred while initializing PingProtect');
        }
      }
      return selfSubmitFunction && selfSubmitFunction();
    }
    handleGetData();
  });

  $: {
    pauseBehavioralData = pingProtect?.behavioralDataCollection ?? false;
    if (typeof window !== 'undefined') {
      if (pauseBehavioralData === true) {
        PIProtect.pauseBehavioralData();
      } else {
        PIProtect.resumeBehavioralData();
      }
    }
  }
</script>

<div class="tw_text-center tw_w-full tw_py-4">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24">
    <p><T key="signalsEvaluation" /></p>
  </Spinner>
</div>
