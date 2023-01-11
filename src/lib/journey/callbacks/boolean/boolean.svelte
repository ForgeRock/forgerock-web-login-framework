<script lang="ts">
  import { getAttributeValidationFailureText } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Standard from '$components/compositions/checkbox/standard.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let style: Style = {};

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;

  let inputName: string;
  // A boolean being required doesn't make much sense, so commenting it out for now
  // let isRequired = isInputRequired(callback);
  let outputName: string;
  let previousValue: boolean;
  let prompt: string;
  let typedCallback: AttributeInputCallback<boolean>;
  let validationFailure: string;

  function setValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    typedCallback.setInputValue((event.target as HTMLInputElement).checked);
  }

  $: {
    typedCallback = callback as AttributeInputCallback<boolean>;
    inputName = typedCallback?.payload?.input?.[0].name || `boolean-attr-${callbackMetadata?.idx}`;
    // A boolean being required doesn't make much sense, so commenting it out for now
    // isRequired = isInputRequired(callback);
    outputName = typedCallback.getOutputByName('name', '');
    previousValue = typedCallback.getInputValue() as boolean;
    prompt = typedCallback.getPrompt();
    validationFailure = getAttributeValidationFailureText(typedCallback);
  }
</script>

<Checkbox
  isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
  isInvalid={!!validationFailure}
  key={inputName}
  message={validationFailure}
  onChange={setValue}
  value={previousValue}
>
  {interpolate(textToKey(outputName), null, prompt)}
</Checkbox>
