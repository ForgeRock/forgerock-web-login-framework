<script lang="ts">
  import {
    getInputTypeFromPolicies,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationPolicies,
    getValidationFailures,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type { CallbackMetadata, SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: AttributeInputCallback<string>;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  let inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata.idx}`;
  let isRequired = isInputRequired(callback);
  let outputName = callback.getOutputByName('name', '');
  let policies = callback.getPolicies();
  let previousValue = callback?.getInputValue() as string;
  let prompt = callback.getPrompt();
  let type = getInputTypeFromPolicies(policies);

  let validationRules = getValidationPolicies(callback.getPolicies());
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
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata.idx}`;
    isRequired = isInputRequired(callback);
    outputName = callback.getOutputByName('name', '');
    policies = callback.getPolicies();
    previousValue = callback?.getInputValue() as string;
    prompt = callback.getPrompt();
    type = getInputTypeFromPolicies(policies);

    validationRules = getValidationPolicies(callback.getPolicies());
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Input
  isFirstInvalidInput={callbackMetadata.isFirstInvalidInput}
  key={inputName}
  label={interpolate(outputName, null, prompt)}
  message={isRequired ? interpolate('inputRequiredError') : undefined}
  onChange={setValue}
  {isRequired}
  {isInvalid}
  {type}
  showMessage={!!isInvalid}
  value={previousValue}
>
  <Policies {callback} key={inputName} label={prompt} messageKey="valueRequirements" />
</Input>
