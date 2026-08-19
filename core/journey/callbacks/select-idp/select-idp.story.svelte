<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import SelectIdp from './select-idp.svelte';

  import type { SelectIdPCallback } from '@forgerock/journey-client/types';

  interface Props {
    socialCallback: SelectIdPCallback;
  }

  let { socialCallback }: Props = $props();

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
