<script lang="ts">
  import type { PollingWaitCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import PollingWait from './polling-wait.svelte';

  import type { CallbackMetadata, SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';

  export let callback: PollingWaitCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: SelfSubmitFunction;
  export let stepMetadata: StepMetadata;
</script>

<Centered>
  <PollingWait {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} />
</Centered>
