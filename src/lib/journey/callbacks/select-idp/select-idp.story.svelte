<script lang="ts">
  import type { PasswordCallback } from '@forgerock/javascript-sdk';
  import type { SelectIdPCallback } from '@forgerock/javascript-sdk';
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import SelectIdp from './select-idp.svelte';

  export let passwordCallback: PasswordCallback;
  export let socialCallback: never;
  export let usernameCallback: NameCallback;
  export let localAuth: boolean;

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
