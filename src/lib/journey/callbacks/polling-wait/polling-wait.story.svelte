<script lang="ts">
  import type { PollingWaitCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import PollingWait from './polling-wait.svelte';

  import type {
    SelfSubmitFunction,
  } from '$journey/journey.interfaces';

  export let callback: PollingWaitCallback;
  export let selfSubmitFunction: SelfSubmitFunction;

  let callbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: true,
      isUserInputRequired: false,
    },
    idx: 0,
  };
  let stepMetadata = {
    derived: {
      isStepSelfSubmittable: true,
      isUserInputOptional: false,
      numOfCallbacks: 2,
      numOfSelfSubmittableCbs: 2,
      numOfUserInputCbs: 0,
    },
  };
</script>

<Centered>
  <PollingWait {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} />
</Centered>
