<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Name from './name.svelte';

  export let callback: NameCallback;

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
  <Name {callback} {callbackMetadata} {stepMetadata} />
</Centered>
