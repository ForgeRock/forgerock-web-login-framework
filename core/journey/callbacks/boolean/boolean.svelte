<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import { interpolate, textToKey } from '$core/_utilities/i18n.utilities';
  import { getAttributeValidationFailureText } from '$journey/callbacks/_utilities/callback.utilities';

  import type { AttributeInputCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  export const stepMetadata: Maybe<StepMetadata> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;

  interface Props {
    callback: AttributeInputCallback<boolean>;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback, callbackMetadata, style = {} }: Props = $props();

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;

  let inputName: string = $state();
  // A boolean being required doesn't make much sense, so commenting it out for now
  // let isRequired = isInputRequired(callback);
  let outputName: string = $state();
  let previousValue: boolean = $state();
  let prompt: string = $state();
  let validationFailure: string = $state();

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).checked);
  }

  run(() => {
    inputName = callback?.payload?.input?.[0].name || `boolean-attr-${callbackMetadata?.idx}`;
    // A boolean being required doesn't make much sense, so commenting it out for now
    // isRequired = isInputRequired(callback);
    outputName = callback.getOutputByName('name', '');
    previousValue = callback.getInputValue() as boolean;
    prompt = callback.getPrompt();
    validationFailure = getAttributeValidationFailureText(callback);
  });
</script>

{#key callback}
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
{/key}
