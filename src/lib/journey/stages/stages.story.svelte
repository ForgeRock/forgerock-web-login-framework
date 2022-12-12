<script lang="ts">
  import type {
    PasswordCallback,
    NameCallback,
    SelectIdPCallback,
  } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Generic from './generic.svelte';
  import { initialize as initializeLinks } from '$lib/links.store';
  import { initialize as initializeStyles } from '$lib/style.store';
  import Registration from './registration.svelte';

  import UsernamePassword from './username-password.svelte';

  import type {
    StageFormObject,
    StageJourneyObject,
    WidgetStep,
  } from '$journey/journey.interfaces';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let step: WidgetStep;
  export let stage: string;
  export let labelType: 'floating' | 'stacked';

  export let passwordCallback: PasswordCallback;
  export let socialCallback: SelectIdPCallback;
  export let usernameCallback: NameCallback;
  export let localAuth: boolean;

  // Initialize stores
  initializeLinks({ termsAndConditions: '/' });
  initializeStyles({ labels: labelType });
</script>

<Centered>
  {#if stage === 'UsernamePassword'}
    <UsernamePassword {form} {journey} {step} />
  {:else if stage === 'Registration'}
    <Registration {form} {journey} {step} />
  {:else}
    <Generic {form} {journey} {step} />
  {/if}
</Centered>
