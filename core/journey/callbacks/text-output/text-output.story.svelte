<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { WebAuthnStepType, type TextOutputCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import TextOutput from './text-output.svelte';

  export let callback: TextOutputCallback;
  export const recoveryCodes: string[] = [];
  export const webAuthnValue: WebAuthnStepType = WebAuthnStepType.None;
</script>

<Centered>
  <TextOutput {callback} />
</Centered>
