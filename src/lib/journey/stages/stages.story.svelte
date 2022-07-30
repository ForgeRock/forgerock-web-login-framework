<script lang="ts">
  import type { FRStep, FRLoginFailure, FRLoginSuccess } from '@forgerock/javascript-sdk';
  import Centered from '$components/primitives/box/centered.svelte';
  import Generic from './generic.svelte';
  import { initialize } from '$lib/locale.store';
  import Registration from './registration.svelte';
  import UsernamePassword from './username-password.svelte';

  type StepTypes = FRStep | FRLoginFailure | FRLoginSuccess | null;

  export let failureMessage: string;
  export let step: StepTypes;
  export let submitForm: () => void;
  export let stage: string;

  // Initialize localized content
  initialize();
</script>

<Centered>
  {#if stage === 'UsernamePassword'}
    <UsernamePassword {failureMessage} {step} {submitForm} />
  {:else if stage === 'Registration'}
    <Registration {failureMessage} {step} {submitForm} />
  {:else}
    <Generic {failureMessage} {step} {submitForm} />
  {/if}
</Centered>
