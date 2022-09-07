<script lang="ts">
  import {
    getInputTypeFromPolicies,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationFailures,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  export let callback: AttributeInputCallback<string>;
  export let firstInvalidInput: boolean;
  export let idx: number;

  let inputName = callback?.payload?.input?.[0].name || `password-${idx}`;
  let isRequired = isInputRequired(callback);
  let outputName = callback.getOutputByName('name', '');
  let policies = callback.getPolicies();
  let previousValue = callback?.getInputValue() as string;
  let prompt = callback.getPrompt();
  let type = getInputTypeFromPolicies(policies);

  let validationFailures = getValidationFailures(callback, prompt);
  let isInvalid = !!validationFailures.length;

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
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    inputName = callback?.payload?.input?.[0].name || `password-${idx}`;
    isRequired = isInputRequired(callback);
    outputName = callback.getOutputByName('name', '');
    policies = callback.getPolicies();
    previousValue = callback?.getInputValue() as string;
    prompt = callback.getPrompt();
    type = getInputTypeFromPolicies(policies);

    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Input
  {firstInvalidInput}
  key={inputName}
  label={interpolate(outputName, null, prompt)}
  onChange={setValue}
  {isRequired}
  {isInvalid}
  showMessage={!validationFailures.length}
  {type}
  value={previousValue}>

  <Policies {callback} key={inputName} label={prompt} messageKey="valueRequirements" />
</Input>
