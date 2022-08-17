<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import {
    getUsernameValidationFailureText,
    isInputRequired,
  } from '$journey/utilities/callback.utilities';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/utilities/i18n.utilities';

  export let callback: ValidatedCreateUsernameCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

  let callbackType = callback.getType();
  let inputName = callback?.payload?.input?.[0].name || `validated-name=${idx}`;
  let isRequired = isInputRequired(callback);
  let label = callback.getPrompt();
  let textInputLabel = callback.getPrompt();
  let value = callback?.getInputValue();
  let validationFailure = getUsernameValidationFailureText(callback, label);

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `validated-name=${idx}`;
    isRequired = isInputRequired(callback);
    label = callback.getPrompt();
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
    validationFailure = getUsernameValidationFailureText(callback, label);
  }
</script>

<Input
  errorMessage={validationFailure}
  {firstInvalidInput}
  {isRequired}
  key={inputName}
  label={interpolate(callbackType, null, textInputLabel)}
  onChange={setValue}
  type="text"
  value={typeof value === 'string' ? value : ''}
/>
