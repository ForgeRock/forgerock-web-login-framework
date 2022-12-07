<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './validated-create-username.svelte';

  export let callback: ValidatedCreateUsernameCallback;

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
  <Input {callback} {callbackMetadata} {stepMetadata} />
</Centered>
