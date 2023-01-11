<script lang="ts">
  import type { RedirectCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Redirect from './redirect.svelte';
  import type { WidgetStep } from '$journey/journey.interfaces';

  export let callback: never;
  export let step: WidgetStep;

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
