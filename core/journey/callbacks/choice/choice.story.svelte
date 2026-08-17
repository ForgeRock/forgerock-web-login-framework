<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Choice from './choice.svelte';

  import type { ChoiceCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { CallbackMetadata } from '$journey/journey.interfaces';

  interface Props {
    callback: ChoiceCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
  }

  let { callback, callbackMetadata }: Props = $props();

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
      isStepSelfSubmittable: () => false,
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
