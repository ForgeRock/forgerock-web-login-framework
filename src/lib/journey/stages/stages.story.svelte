<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Generic from './generic.svelte';
  import { initialize as initializeLinks } from '$lib/links.store';
  import { initialize as initializeStyles } from '$lib/style.store';
  import Registration from './registration.svelte';
  import UsernamePassword from './username-password.svelte';

  import type { WidgetStep } from '$journey/journey.interfaces';

  export let displayIcon: boolean;
  export let failureMessage: string;
  export let step: WidgetStep;
  export let submitForm: () => void;
  export let stage: string;
  export let loading = false;
  export let labelType: 'floating' | 'stacked';

  // Initialize stores
  initializeLinks({ termsAndConditions: '/' });
  initializeStyles({ labels: labelType });
</script>

<Centered>
  {#if stage === 'UsernamePassword'}
    <UsernamePassword {displayIcon} {failureMessage} {loading} {step} {submitForm} />
  {:else if stage === 'Registration'}
    <Registration {displayIcon} {failureMessage} {loading} {step} {submitForm} />
  {:else}
    <Generic {displayIcon} {failureMessage} {loading} {step} {submitForm} />
  {/if}
</Centered>
