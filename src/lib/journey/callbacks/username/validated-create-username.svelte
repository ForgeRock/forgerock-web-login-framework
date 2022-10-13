<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationPolicies,
    getValidationFailures,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type { CallbackMetadata, SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: ValidatedCreateUsernameCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType = callback.getType();
  let inputName = callback?.payload?.input?.[0].name || `validated-name-${callbackMetadata.idx}`;
  let isRequired = isInputRequired(callback);
  let prompt = callback.getPrompt();
  let value = callback?.getInputValue();

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
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `validated-name=${callbackMetadata.idx}`;
    isRequired = isInputRequired(callback);
    prompt = callback.getPrompt();
    value = callback?.getInputValue();

    validationRules = getValidationPolicies(callback.getPolicies());
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Input
  isFirstInvalidInput={callbackMetadata.isFirstInvalidInput}
  {isRequired}
  {isInvalid}
  key={inputName}
  label={interpolate(textToKey(callbackType), null, prompt)}
  message={isRequired ? interpolate('inputRequiredError') : undefined}
  onChange={setValue}
  showMessage={false}
  type="text"
  value={typeof value === 'string' ? value : ''}
>
  <Policies {callback} key={inputName} label={prompt} messageKey="usernameRequirements" />
</Input>
