<script lang="ts">
  import type { FRStep, FRLoginFailure, FRLoginSuccess } from '@forgerock/javascript-sdk';
  import type { Writable } from 'svelte/store';

  import Centered from '$components/primitives/box/centered.svelte';
  import Step from './generic.svelte';

  type StepTypes = FRStep | FRLoginFailure | FRLoginSuccess | null;

  export let step: Writable<StepTypes>;
  export let submitForm: () => void;
</script>

<Centered>
  <Step {step} {submitForm} />
</Centered>
