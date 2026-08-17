<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  /**
   * TODO: Does PasswordCallback do anything that would need to be accounted for here?
   *
   * This is intentionally separated from ValidatedCreatePasswordCallback as it does
   * allow for easier typing for the callback.
   */
  import Base from './base.svelte';

  import type { PasswordCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  interface Props {
    callback: PasswordCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback = $bindable(), callbackMetadata, style = {} }: Props = $props();

  let inputName: string = $state();

  run(() => {
    callback = callback as PasswordCallback;
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
  });
</script>

<Base {callback} {callbackMetadata} {style} key={inputName} />
