<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { onMount } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import { protectStore } from '$core/protect/protect.store';

  import type { PingOneProtectEvaluationCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { ProtectConfig } from '$core/protect/protect.store';
  import type { SelfSubmitFunction } from '$journey/journey.interfaces';

  interface Props {
    callback: PingOneProtectEvaluationCallback;
    selfSubmitFunction?: Maybe<SelfSubmitFunction>;
    pingProtect?: ProtectConfig;
  }

  let { callback, selfSubmitFunction = null, pingProtect = {
    envId: '',
  } }: Props = $props();

  let isBehavioralDataPaused = $state(false);

  onMount(() => {
    async function handleGetData() {
      const result = await protectStore.getData();
      if (result && typeof result === 'object' && 'error' in result) {
        callback.setClientError(result.error);
      } else {
        callback.setData(result);
      }
      return selfSubmitFunction && selfSubmitFunction();
    }
    handleGetData();
  });

  run(() => {
    isBehavioralDataPaused = pingProtect?.behavioralDataCollection ?? false;
    if (typeof window !== 'undefined') {
      if (isBehavioralDataPaused === true) {
        const pauseResult = protectStore.pauseBehavioralData();
        if (pauseResult && 'error' in pauseResult) {
          callback.setClientError(pauseResult.error);
        }
      } else {
        const resumeResult = protectStore.resumeBehavioralData();
        if (resumeResult && 'error' in resumeResult) {
          callback.setClientError(resumeResult.error);
        }
      }
    }
  });
</script>

<div class="tw_text-center tw_w-full tw_py-4">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24">
    <p><T key="signalsEvaluation" /></p>
  </Spinner>
</div>
