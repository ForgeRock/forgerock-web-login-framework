<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Redirect from './redirect.svelte';

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
    isUserInputOptional: false,
    isStepSelfSubmittable: false,
    numOfCallbacks: 2,
    numOfSelfSubmittableCbs: 0,
    numOfUserInputCbs: 2,
  };
</script>

<Centered>
  <Redirect {callback} {callbackMetadata} {stepMetadata} />
</Centered>
