<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import { getData, pauseBehavioralData, resumeBehavioralData } from '$core/protect/protect.store';

  import type { PingOneProtectEvaluationCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { ProtectConfig } from '$core/protect/protect.store';
  import type { SelfSubmitFunction } from '$journey/journey.interfaces';

  export let callback: PingOneProtectEvaluationCallback;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let pingProtect: ProtectConfig = {
    envId: '',
  };

  let isBehavioralDataPaused = false;

  onMount(() => {
    async function handleGetData() {
      const result = await getData();
      if (typeof result === 'object') {
        callback.setClientError(result.error);
      } else {
        callback.setData(result);
        console.log('Data set on Protect evaluation callback');
      }
      return selfSubmitFunction && selfSubmitFunction();
    }
    handleGetData();
  });

  $: {
    isBehavioralDataPaused = pingProtect?.behavioralDataCollection ?? false;
    if (typeof window !== 'undefined') {
      if (isBehavioralDataPaused === true) {
        pauseBehavioralData();
      } else {
        resumeBehavioralData();
      }
    }
  }
</script>

<div class="tw_text-center tw_w-full tw_py-4">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24">
    <p><T key="signalsEvaluation" /></p>
  </Spinner>
</div>
