<script lang="ts">
  import type { z } from 'zod';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';
  import type { HiddenValueCallback } from '@forgerock/javascript-sdk';

  export const callback: Maybe<HiddenValueCallback> = null;
  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};
</script>
