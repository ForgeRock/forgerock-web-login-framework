<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import Base from '$journey/callbacks/password/base.svelte';
  import { getPasswordValidationFailureText, isInputRequired } from '$journey/utilities/callback.utilities';

  export let callback: ValidatedCreatePasswordCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

  /**
   * This callback does not indicate that the input is required.
   */
  const isRequired = isInputRequired(callback);

  let label = callback.getPrompt();
  let validationFailure = getPasswordValidationFailureText(callback, label);

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
    */
    label = callback.getPrompt();
    validationFailure = getPasswordValidationFailureText(callback, label);
  }
</script>

<Base {callback} {firstInvalidInput} {idx} {isRequired} {validationFailure} />
