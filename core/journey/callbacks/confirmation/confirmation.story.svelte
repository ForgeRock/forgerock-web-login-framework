<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Confirmation from './confirmation.svelte';

  import type { ConfirmationCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { CallbackMetadata, StepMetadata } from '$journey/journey.interfaces';

  interface Props {
    callback: ConfirmationCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    selfSubmitFunction: () => void;
    stepMetadata: Maybe<StepMetadata>;
  }

  let { callback, callbackMetadata, selfSubmitFunction, stepMetadata }: Props = $props();
</script>

<Centered>
  <Confirmation {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} />
</Centered>
