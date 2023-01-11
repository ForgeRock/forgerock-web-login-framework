<script lang="ts">
  import type { ConfirmationCallback } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';

  import Confirmation from './confirmation.svelte';
  import type { CallbackMetadata, StepMetadata } from '$journey/journey.interfaces';

  export let callback: never;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: () => void;
  export let stepMetadata: StepMetadata;
</script>

<Centered>
  <Confirmation {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} />
</Centered>
