<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Choice from './choice.svelte';

  export let callback: ChoiceCallback;
  export let displayType: 'radio' | 'select' | undefined;

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
  <Choice {callback} {callbackMetadata} {displayType} {stepMetadata} />
</Centered>
