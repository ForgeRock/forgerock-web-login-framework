<script lang="ts">
  import type { FRStep } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Generic from './generic.svelte';
  import { initialize as initializeLinks } from '$lib/links.store';
  import { initialize as initializeStyles } from '$lib/style.store';
  import Registration from './registration.svelte';

  import UsernamePassword from './username-password.svelte';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import { initCheckValidation } from './_utilities/step.utilities';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let step: FRStep;
  export let stage: string;
  export let labelType: 'floating' | 'stacked';

  // Create metadata
  const callbackMetadata = buildCallbackMetadata(step, initCheckValidation());
  const stepMetadata = buildStepMetadata(callbackMetadata);
  const metadata = {
    callbacks: callbackMetadata,
    step: stepMetadata,
  };

  // Initialize stores
  initializeLinks({ termsAndConditions: '/' });
  initializeStyles({ labels: labelType });
</script>

<Centered>
  {#if stage === 'UsernamePassword'}
    <UsernamePassword {form} {journey} {metadata} {step} />
  {:else if stage === 'Registration'}
    <Registration {form} {journey} {metadata} {step} />
  {:else}
    <Generic {form} {journey} {metadata} {step} />
  {/if}
</Centered>
