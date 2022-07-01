<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import {
    getUsernameValidationFailureText,
    isInputRequired,
  } from '$journey/utilities/callback.utilities';
  import Input from '$components/compositions/input-floating/floating-label.svelte';

  export let callback: ValidatedCreateUsernameCallback;
  export let inputName: string;

  const existingValue = callback?.getInputValue() as string;
  const isRequired = isInputRequired(callback);
  const label = callback.getPrompt();
  const textInputLabel = callback.getPrompt();
  const validationFailure = getUsernameValidationFailureText(callback, label);

  let type: 'text' = 'text';

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(event.target.value);
  }
</script>

<Input
  errorMessage={validationFailure}
  {isRequired}
  key={inputName}
  label={textInputLabel}
  onChange={setValue}
  {type}
  value={existingValue}
/>
