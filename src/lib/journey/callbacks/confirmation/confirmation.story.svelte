<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import type { ConfirmationCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import Confirmation from './confirmation.svelte';
  import type { CallbackMetadata, StepMetadata } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';

  export let callback: ConfirmationCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: () => void;
  export let stepMetadata: Maybe<StepMetadata>;
</script>

<Centered>
  <Confirmation {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} />
</Centered>
