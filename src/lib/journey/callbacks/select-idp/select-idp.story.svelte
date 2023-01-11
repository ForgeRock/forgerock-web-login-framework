<script lang="ts">import Centered from '$components/primitives/box/centered.svelte';
  import SelectIdp from './select-idp.svelte';

  export let socialCallback: never;

  let socialCallbackMetadata = {
    canForceUserInputOptionality: true,
    isFirstInvalidInput: false,
    isReadyForSubmission: true,
    isSelfSubmitting: true,
    isUserInputRequired: false,
    idx: 0,
  };

  let stepMetadata = {
    isStepSelfSubmittable: true,
    isUserInputOptional: true,
    numOfCallbacks: 1,
    numOfSelfSubmittableCbs: 1,
    numOfUserInputCbs: 0,
  };
</script>

<Centered>
  <SelectIdp callback={socialCallback} callbackMetadata={socialCallbackMetadata} {stepMetadata} />
</Centered>
