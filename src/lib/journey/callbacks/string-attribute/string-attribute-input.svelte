<script lang="ts">
  import {
    getAttributeValidationFailureText,
    getInputTypeFromPolicies,
    isInputRequired,
  } from '$journey/utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';

  export let callback: AttributeInputCallback<string>;
  export let idx: number;

  const inputName = callback?.payload?.input?.[0].name || `string-attr-${idx}`;
  const isRequired = isInputRequired(callback);
  const label = callback.getPrompt();
  const policies = callback.getPolicies();
  const type = getInputTypeFromPolicies(policies);
  const previousValue = callback?.getInputValue() as string;
  const textInputLabel = callback.getPrompt();
  const validationFailure = getAttributeValidationFailureText(callback);

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
</script>

<Input
  errorMessage={validationFailure}
  key={inputName}
  label={textInputLabel}
  onChange={setValue}
  {isRequired}
  {type}
  value={previousValue}
/>
