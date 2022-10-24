<script lang="ts">
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';
  import type { Style } from '$lib/style.store';
  import type { FRCallback } from '@forgerock/javascript-sdk';

  export let callback: FRCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  const type = callback.getType();
</script>

<p class="tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing">
  Unknown callback encountered: {type}. Please contact support.
</p>
