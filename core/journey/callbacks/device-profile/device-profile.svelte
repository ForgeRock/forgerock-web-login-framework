<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { Device } from '@forgerock/journey-client/device';

  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';

  import type { DeviceProfileCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  interface Props {
    callback: DeviceProfileCallback;
    callbackMetadata?: Maybe<CallbackMetadata>;
    stepMetadata?: Maybe<StepMetadata>;
    selfSubmitFunction: SelfSubmitFunction;
  }

  let {
    callback,
    callbackMetadata = $bindable(null),
    stepMetadata = null,
    selfSubmitFunction,
  }: Props = $props();
  const device = new Device({});
  let deviceMessage = (callback as DeviceProfileCallback).getMessage();
  async function initializeProfile() {
    const location = callback?.isLocationRequired() ?? false;
    const metadata = callback?.isMetadataRequired() ?? false;
    const profile = await device.getProfile({ location, metadata });
    callback.setProfile(profile);
    if (callbackMetadata) {
      callbackMetadata.derived.isReadyForSubmission = true;
    }
    return selfSubmitFunction && selfSubmitFunction();
  }
  initializeProfile();
</script>

{#if stepMetadata?.derived.numOfCallbacks === 1}
  <div class="tw_text-center tw_w-full tw_py-4">
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
    <Text>{deviceMessage}</Text>
  </div>
{/if}
