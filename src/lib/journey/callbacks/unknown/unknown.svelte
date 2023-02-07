<script lang="ts">
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';
  import type { Style } from '$lib/style.store';
  import type { FRCallback } from '@forgerock/javascript-sdk';

  // Unused props. Setting to const prevents errors in console
  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: Style = {};

  export let callback: FRCallback;

  const type = callback.getType();
</script>

<p class="tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing">
  Unknown callback encountered: {type}. Please contact support.
</p>
