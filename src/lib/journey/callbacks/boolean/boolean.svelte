<script lang="ts">
  import { getAttributeValidationFailureText } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Standard from '$components/compositions/checkbox/standard.svelte';

  import type { CallbackMetadata, SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: AttributeInputCallback<boolean>;
  export let callbackMetadata: CallbackMetadata;
  export let stepMetadata: StepMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let style: Style = {};

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;
  const inputName = callback?.payload?.input?.[0].name || `boolean-attr-${callbackMetadata.idx}`;
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
  isFirstInvalidInput={callbackMetadata.isFirstInvalidInput}
  isInvalid={!!validationFailure}
  key={inputName}
  message={validationFailure}
  onChange={setValue}
  value={previousValue}
>
  {interpolate(textToKey(outputName), null, prompt)}
</Checkbox>
