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
  import type { z } from 'zod';

  import type { styleSchema } from '$core/style.store';

  export let callback: TextOutputCallback;
  export let style: z.infer<typeof styleSchema> = {};
  export const recoveryCodes: string[] = [];
  export const webAuthnValue: WebAuthnStepType = WebAuthnStepType.None;
</script>

<Centered>
  <TextOutput {callback} {style} />
</Centered>
