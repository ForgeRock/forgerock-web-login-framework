<script lang="ts">
  /**
   * TODO: Does PasswordCallback do anything that would need to be accounted for here?
   *
   * This is intentionally separated from ValidatedCreatePasswordCallback as it does
   * allow for easier typing for the callback.
   */
  import type { PasswordCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Base from './base.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: PasswordCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  let inputName: string;

  $: {
    callback = callback as PasswordCallback;
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
  }
</script>

<Base {callback} {callbackMetadata} {style} key={inputName} />
