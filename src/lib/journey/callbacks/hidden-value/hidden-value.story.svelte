<script lang="ts">
  import type { HiddenValueCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import HiddenValue from './hidden-value.svelte';

  export let callback: HiddenValueCallback;

  let callbackMetadata = {
    canForceUserInputOptionality: false,
    isFirstInvalidInput: false,
    isReadyForSubmission: false,
    isSelfSubmitting: false,
    isUserInputRequired: true,
    idx: 0,
  };
  let stepMetadata = {
    isStepSelfSubmittable: false,
    isUserInputOptional: false,
    numOfCallbacks: 2,
    numOfSelfSubmittableCbs: 0,
    numOfUserInputCbs: 2,
  };
</script>

<Centered>
  <HiddenValue {callback} {callbackMetadata} {stepMetadata} />
</Centered>
