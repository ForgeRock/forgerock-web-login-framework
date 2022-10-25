<script lang="ts">
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Input from './string-attribute-input.svelte';

  export let callback: AttributeInputCallback<string>;

  let callbackMetadata = {
    isFirstInvalidInput: false,
    isReadyForSubmission: false,
    isSelfSubmitting: false,
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
  <Input {callback} {callbackMetadata} {stepMetadata} />
</Centered>
