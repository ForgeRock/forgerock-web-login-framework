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
  export let loading: boolean = false;

  // Initialize localized content
  initialize();
</script>

<Centered>
  {#if stage === 'UsernamePassword'}
    <UsernamePassword {failureMessage} {loading} {step} {submitForm} />
  {:else if stage === 'Registration'}
    <Registration {failureMessage} {loading} {step} {submitForm} />
  {:else}
    <Generic {failureMessage} {loading} {step} {submitForm} />
  {/if}
</Centered>
