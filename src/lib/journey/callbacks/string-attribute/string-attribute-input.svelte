<script lang="ts">
  import {
    getInputTypeFromPolicies,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  export let callback: AttributeInputCallback<string>;
  export let firstInvalidInput: boolean;
  export let idx: number;

  let inputName = callback?.payload?.input?.[0].name || `string-attr-${idx}`;
  let isRequired = isInputRequired(callback);
  let outputName = callback.getOutputByName('name', '');
  let policies = callback.getPolicies();
  let type = getInputTypeFromPolicies(policies);
  let previousValue = callback?.getInputValue() as string;
  let textInputLabel = callback.getPrompt();

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
    isRequired = isInputRequired(callback);
    outputName = callback.getOutputByName('name', '');
    policies = callback.getPolicies();
    type = getInputTypeFromPolicies(policies);
    previousValue = callback?.getInputValue() as string;
    textInputLabel = callback.getPrompt();
  }
</script>

<Input
  {firstInvalidInput}
  key={inputName}
  label={interpolate(outputName, null, textInputLabel)}
  onChange={setValue}
  {isRequired}
  {type}
  value={previousValue}>

  <Policies {callback} label={interpolate(outputName, null, textInputLabel)} messageKey="valueRequirements" />
</Input>
