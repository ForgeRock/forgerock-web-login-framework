<script lang="ts">
  import type { TextOutputCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import TextOutput from './text-output.svelte';

  export let callback: TextOutputCallback;

  let callbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
    },
    idx: 0,
  };
  let stepMetadata = {
    derived: {
      isStepSelfSubmittable: () => false,
      isUserInputOptional: false,
      numOfCallbacks: 2,
      numOfSelfSubmittableCbs: 0,
      numOfUserInputCbs: 2,
    },
  };
</script>

<Centered>
  <TextOutput {callback} {callbackMetadata} {stepMetadata} />
</Centered>
