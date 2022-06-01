<script lang="ts">
  import { getStringAttributeValidationFailureText, isInputRequired } from '$journey/utilities/callback.utilities';
  import Input from "$components/primitives/input/floating-label.svelte";

  export let callback: any;
  export let inputName: string;

  const existingValue = callback?.getInputValue();
  const isRequired = isInputRequired(callback);
  const label = callback.getPrompt();
  const textInputLabel = callback.getPrompt();
  const validationFailure = getStringAttributeValidationFailureText(callback, label);

  let type = 'text';

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

<Input key={inputName} label={textInputLabel} onChange={setValue} {isRequired} {type} value={existingValue}>
  {#if validationFailure}
    <div class="invalid-feedback">{validationFailure}</div>
  {/if}
</Input>
