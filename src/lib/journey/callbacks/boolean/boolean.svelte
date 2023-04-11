<script lang="ts">
  import { getAttributeValidationFailureText } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Standard from '$components/compositions/checkbox/standard.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export const stepMetadata: Maybe<StepMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;

  export let callback: AttributeInputCallback<boolean>;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;

  let inputName: string;
  // A boolean being required doesn't make much sense, so commenting it out for now
  // let isRequired = isInputRequired(callback);
  let outputName: string;
  let previousValue: boolean;
  let prompt: string;
  let validationFailure: string;

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).checked);
  }

  $: {
    inputName = callback?.payload?.input?.[0].name || `boolean-attr-${callbackMetadata?.idx}`;
    // A boolean being required doesn't make much sense, so commenting it out for now
    // isRequired = isInputRequired(callback);
    outputName = callback.getOutputByName('name', '');
    previousValue = callback.getInputValue() as boolean;
    prompt = callback.getPrompt();
    validationFailure = getAttributeValidationFailureText(callback);
  }
</script>

<Checkbox
  isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
  isInvalid={!!validationFailure}
  key={inputName}
  message={validationFailure}
  onChange={setValue}
  value={previousValue}
>
  {interpolate(textToKey(outputName), null, prompt)}
</Checkbox>
