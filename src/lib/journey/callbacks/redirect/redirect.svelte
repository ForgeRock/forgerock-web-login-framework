<script lang="ts">
  import type { RedirectCallback } from '@forgerock/javascript-sdk';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: RedirectCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  let message: string;

  $: {
    message = `${interpolate('redirectingTo')} ${new URL(callback.getRedirectUrl()).hostname}`;
  }
</script>

<div class="tw_text-center" aria-live="assertive">
  <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
  <Text>{message}</Text>
</div>
