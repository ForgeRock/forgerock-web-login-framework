<script lang="ts">
  import type { DeviceProfileCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import DeviceProfile from './device-profile.svelte';

  import type { CallbackMetadata, StepMetadata } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';

  export let callback: DeviceProfileCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: () => void;

  let mergedCallbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
    },
    idx: 0,
    ...callbackMetadata,
  };
  let stepMetadata: StepMetadata = {
    derived: {
      isStepSelfSubmittable: () => false,
      isUserInputOptional: false,
      numOfCallbacks: 1,
      numOfSelfSubmittableCbs: 0,
      numOfUserInputCbs: 2,
    },
  };
</script>

<Centered>
  <DeviceProfile
    {callback}
    callbackMetadata={mergedCallbackMetadata}
    {stepMetadata}
    {selfSubmitFunction}
  />
</Centered>
