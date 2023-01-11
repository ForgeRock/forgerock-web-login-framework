<script lang="ts">
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: Style = {};

  /**
   * TODO: this can't be a `const` to fix the warning as it can't be assigned a default value
   * due to the `never` type that is an unfortunately side-effect of our callback mapping at
   * the stage level.
   */
  export let callback: never;
</script>
