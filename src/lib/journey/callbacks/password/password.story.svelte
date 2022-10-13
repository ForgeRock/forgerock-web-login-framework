<script lang="ts">
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Password from './password.svelte';

  export let callback: PasswordCallback;

  let callbackMetadata = {
    isFirstInvalidInput: false,
    isReadyForSubmission: false,
    isSelfSubmittingCb: false,
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
  <Password {callback} {callbackMetadata} {stepMetadata} />
</Centered>
