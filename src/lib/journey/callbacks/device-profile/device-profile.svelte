<script lang="ts">
  import { FRDevice, type DeviceProfileCallback } from '@forgerock/javascript-sdk';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';

  export let callback: DeviceProfileCallback;
  export let callbackMetadata: Maybe<CallbackMetadata> = null;
  export let stepMetadata: Maybe<StepMetadata> = null;
  export let selfSubmitFunction: SelfSubmitFunction;
  const device = new FRDevice({});
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
