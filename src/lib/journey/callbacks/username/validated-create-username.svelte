<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import {
    getUsernameValidationFailureText,
    isInputRequired,
  } from '$journey/utilities/callback.utilities';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/utilities/i18n.utilities';

  export let callback: ValidatedCreateUsernameCallback;
  export let idx: number;

  const callbackType = callback.getType();
  const inputName = callback?.payload?.input?.[0].name || `validated-name=${idx}`;
  const isRequired = isInputRequired(callback);
  const label = callback.getPrompt();
  const textInputLabel = callback.getPrompt();
  const unknownValue = callback?.getInputValue();
  const validationFailure = getUsernameValidationFailureText(callback, label);

  let type: 'text' = 'text';

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
    console.log(callback);
  }
</script>

<Input
  errorMessage={validationFailure}
  {isRequired}
  key={inputName}
  label={interpolate(callbackType, null, textInputLabel)}
  onChange={setValue}
  {type}
  value={typeof unknownValue === 'string' ? unknownValue : ''}
/>
