<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Choice from './choice.svelte';

  import type { CallbackMetadata } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';

  export let callback: ChoiceCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;

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
  <Choice {callback} callbackMetadata={mergedCallbackMetadata} {stepMetadata} />
</Centered>
