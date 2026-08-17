<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Name from './name.svelte';

  import type { NameCallback } from '@forgerock/journey-client/types';
  import type { FullAutoFill } from 'svelte/elements';

  interface Props {
    callback: NameCallback;
    autocompleteValues?: FullAutoFill | undefined;
  }

  let { callback, autocompleteValues = undefined }: Props = $props();

  let callbackMetadata = $derived({
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: true,
      autocompleteValues,
    },
    idx: 0,
  });
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
  <Name {callback} {callbackMetadata} {stepMetadata} />
</Centered>
