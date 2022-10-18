<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';
  import { initialize } from '$lib/links.store';

  import Centered from '$components/primitives/box/centered.svelte';
  import Terms from './terms-conditions.svelte';

  export let callback: TermsAndConditionsCallback;

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
  // Initialize links
  initialize({ termsAndConditions: 'https://www.forgerock.com/terms' });
</script>

<Centered>
  <Terms {callback} {callbackMetadata} {stepMetadata} />
</Centered>
