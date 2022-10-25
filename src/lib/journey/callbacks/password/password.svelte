<script lang="ts">
  /**
   * TODO: Does PasswordCallback do anything that would need to be accounted for here?
   *
   * This is intentionally separated from ValidatedCreatePasswordCallback as it does
   * allow for easier typing for the callback.
   */
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Base from './base.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: PasswordCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  let inputName: string;

  $: {
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata.idx}`;
  }
</script>

<Base {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} {style} key={inputName} />
