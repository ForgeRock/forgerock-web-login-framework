<script lang="ts">
  import type { RedirectCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const callbackMetadata: Maybe<CallbackMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};

  export let callback: RedirectCallback;

  let message: string;

  $: {
    message = `${interpolate('redirectingTo')} ${new URL(callback.getRedirectUrl()).hostname}`;
  }
</script>

<div class="tw_text-center" aria-live="assertive">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
  <Text>{message}</Text>
</div>
