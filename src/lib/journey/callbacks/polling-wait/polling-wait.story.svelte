<script lang="ts">
  import type { PollingWaitCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import PollingWait from './polling-wait.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: SelfSubmitFunction;
  export let stepMetadata: Maybe<StepMetadata>;
</script>

<Centered>
  <PollingWait {callback} {callbackMetadata} {selfSubmitFunction} {stepMetadata} />
</Centered>
