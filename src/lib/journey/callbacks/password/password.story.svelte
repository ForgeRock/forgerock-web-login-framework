<script lang="ts">
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Password from './password.svelte';

  export let callback: PasswordCallback;

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
  <Password {callback} {callbackMetadata} {stepMetadata} />
</Centered>
