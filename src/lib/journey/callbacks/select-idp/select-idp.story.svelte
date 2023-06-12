<script lang="ts">
  import type { SelectIdPCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import SelectIdp from './select-idp.svelte';

  export let socialCallback: SelectIdPCallback;

  let socialCallbackMetadata = {
    derived: {
      canForceUserInputOptionality: true,
      isFirstInvalidInput: false,
      isReadyForSubmission: true,
      isSelfSubmitting: true,
      isUserInputRequired: false,
    },
    idx: 0,
  };

  let stepMetadata = {
    derived: {
      isStepSelfSubmittable: () => true,
      isUserInputOptional: true,
      numOfCallbacks: 1,
      numOfSelfSubmittableCbs: 1,
      numOfUserInputCbs: 0,
    },
  };
</script>

<Centered>
  <SelectIdp callback={socialCallback} callbackMetadata={socialCallbackMetadata} {stepMetadata} />
</Centered>
