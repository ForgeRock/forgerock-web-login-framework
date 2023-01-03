<script lang="ts">
  import type { TextOutputCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import TextOutput from './text-output.svelte';

  export let callback: never;

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
  <TextOutput {callback} {callbackMetadata} {stepMetadata} />
</Centered>
