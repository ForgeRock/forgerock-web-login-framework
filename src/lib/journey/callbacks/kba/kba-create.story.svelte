<script lang="ts">
  import type { KbaCreateCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Kba from './kba-create.svelte';

  export let callback: KbaCreateCallback;

  let callbackMetadata = {
    isFirstInvalidInput: false,
    isReadyForSubmission: false,
    isSelfSubmitting: false,
    isUserInputRequired: true,
    idx: 0,
  };
  let stepMetadata = {
    isStepSelfSubmittable: false,
    numOfCallbacks: 2,
    numOfSelfSubmittableCbs: 0,
    numOfUserInputCbs: 2,
  };
</script>

<Centered>
  <Kba {callback} {callbackMetadata} {stepMetadata} />
</Centered>
