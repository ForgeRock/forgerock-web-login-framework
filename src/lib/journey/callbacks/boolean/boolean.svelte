<script lang="ts">
  import {
    getAttributeValidationFailureText,
    isInputRequired,
  } from '$journey/utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Checkbox from '$components/compositions/checkbox/animated.svelte';
  import { interpolate } from '$lib/utilities/i18n.utilities';

  export let callback: AttributeInputCallback<boolean>;
  export let idx: number;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const inputName = callback?.payload?.input?.[0].name || `boolean-attr-${idx}`;
  // A boolean being required doesn't make much sense, so commenting it out for now
  // const isRequired = isInputRequired(callback);
  const outputName = callback.getOutputByName('name', '');
  const previousValue = callback.getInputValue() as boolean;
  const prompt = callback.getPrompt();
  const validationFailure = getAttributeValidationFailureText(callback);

  function setValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue((event.target as HTMLInputElement).checked);
  }
</script>

<Checkbox
  errorMessage={validationFailure}
  isInvalid={!!validationFailure}
  key={inputName}
  onChange={setValue}
  value={previousValue}
>
  {interpolate(outputName.replace('/', ''), null, prompt)}
</Checkbox>
