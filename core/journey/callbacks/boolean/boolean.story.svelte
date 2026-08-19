<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Checkbox from './boolean.svelte';

  import type { AttributeInputCallback } from '@forgerock/journey-client/types';

  interface Props {
    callback: AttributeInputCallback<boolean>;
  }

  let { callback }: Props = $props();

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
  <Checkbox {callback} {callbackMetadata} {stepMetadata} />
</Centered>
