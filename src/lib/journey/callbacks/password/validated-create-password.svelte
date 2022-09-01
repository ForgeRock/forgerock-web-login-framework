<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import Base from '$journey/callbacks/password/base.svelte';
  import {
    isInputRequired,
  } from '$journey/callbacks/utilities/callback.utilities';
  import Policies from '$journey/callbacks/utilities/policies.svelte';

  export let callback: ValidatedCreatePasswordCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

  /**
   * At the time of this writing, this callback is never marked as required,
   * but I'm adding this here as that could easily change.
   */
  const isRequired = isInputRequired(callback);

  let label = callback.getPrompt();

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    label = callback.getPrompt();
  }
</script>

<Base {callback} {firstInvalidInput} {idx} {isRequired}>
  <Policies {callback} {label} messageKey="passwordRequirements" />
</Base>
