<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { WebAuthnStepType } from '@forgerock/journey-client/webauthn';

  import Centered from '$components/primitives/box/centered.svelte';
  import TextOutput from './text-output.svelte';

  import type { TextOutputCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { CallbackMetadata } from '$journey/journey.interfaces';

  export let callback: TextOutputCallback;
  export let callbackMetadata: Maybe<CallbackMetadata> = null;
  export const recoveryCodes: string[] = [];
  export const webAuthnValue: WebAuthnStepType = WebAuthnStepType.None;
</script>

<Centered>
  <TextOutput {callback} {callbackMetadata} />
</Centered>
