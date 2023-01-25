<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './validated-create-password.svelte';
  import type { CallbackMetadata } from '$journey/journey.interfaces';

  import type { Maybe } from '$lib/interfaces';

  export let callback: ValidatedCreatePasswordCallback;
  export let callbackMetadata: Maybe<CallbackMetadata> = null;

  let mergedCallbackMetadata = {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
    },
    idx: 0,
    ...callbackMetadata,
  };
  let stepMetadata = {
    derived: {
      isStepSelfSubmittable: false,
      isUserInputOptional: false,
      numOfCallbacks: 2,
      numOfSelfSubmittableCbs: 0,
      numOfUserInputCbs: 2,
    },
  };
</script>

<Centered>
  <Input {callback} callbackMetadata={mergedCallbackMetadata} {stepMetadata} />
</Centered>
