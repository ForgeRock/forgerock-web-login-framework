<script lang="ts">
  import {
    getInputTypeFromPolicies,
    isInputRequired,
    type FailedPolicy,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationFailures,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';
  import type { StringDict } from '@forgerock/javascript-sdk/lib/shared/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: Style = {};

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;


  let inputName: string;
  let isRequired: boolean;
  let outputName: string;
  let policies: StringDict<any>;
  let previousValue: string;
  let prompt: string;
  let type: 'email' | 'text';
  let typedCallback: AttributeInputCallback<string>;
  let validationFailures: FailedPolicy[];
  let isInvalid: boolean;

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
    typedCallback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    typedCallback = callback as AttributeInputCallback<string>;
    inputName = typedCallback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
    isRequired = isInputRequired(typedCallback);
    outputName = typedCallback.getOutputByName('name', '');
    policies = typedCallback.getPolicies();
    previousValue = typedCallback?.getInputValue() as string;
    prompt = typedCallback.getPrompt();
    type = getInputTypeFromPolicies(policies);
    validationFailures = getValidationFailures(typedCallback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Input
  isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
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
  <Policies callback={typedCallback} key={inputName} label={prompt} messageKey="valueRequirements" />
</Input>
