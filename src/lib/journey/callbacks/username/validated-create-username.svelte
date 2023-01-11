<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationFailures,
    isInputRequired,
    type FailedPolicy,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: Style = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string;
  let inputName: string;
  let isInvalid: boolean;
  let isRequired: boolean;
  let prompt: string;
  let typedCallback: ValidatedCreateUsernameCallback;
  let value: unknown;
  let validationFailures: FailedPolicy[];

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
    typedCallback = callback as ValidatedCreateUsernameCallback;
    callbackType = typedCallback.getType();
    inputName = typedCallback?.payload?.input?.[0].name || `validated-name=${callbackMetadata?.idx}`;
    isRequired = isInputRequired(typedCallback);
    prompt = typedCallback.getPrompt();
    value = typedCallback?.getInputValue();
    validationFailures = getValidationFailures(typedCallback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Input
  isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
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
  <Policies callback={typedCallback} key={inputName} label={prompt} messageKey="usernameRequirements" />
</Input>
