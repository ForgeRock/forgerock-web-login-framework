<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import {
    getInputTypeFromPolicies,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import { getValidationFailures } from '$journey/callbacks/_utilities/callback.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type { AttributeInputCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type { FailedPolicy } from '$journey/callbacks/_utilities/callback.utilities';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  interface Props {
    callback: AttributeInputCallback<string>;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback, callbackMetadata, style = {} }: Props = $props();

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let inputName: string | undefined = $state();
  let isRequired: boolean | undefined = $state();
  let outputName: string | undefined = $state();
  let policies: Record<string, unknown> = $state({});
  let previousValue: string | undefined = $state();
  let prompt: string | undefined = $state();
  let type: 'email' | 'text' = $state('text');
  let validationFailures: FailedPolicy[] | undefined = $state();
  let isInvalid: boolean | undefined = $state();

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $effect.pre(() => {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
    isRequired = isInputRequired(callback);
    outputName = callback.getOutputByName('name', '');
    policies = callback.getPolicies();
    previousValue = callback?.getInputValue() as string;
    prompt = callback.getPrompt();
    type = getInputTypeFromPolicies(policies);
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  });
</script>

{#key callback}
  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    key={inputName ?? ''}
    label={interpolate(outputName ?? '', null, prompt ?? '')}
    message={isRequired ? interpolate('inputRequiredError') : undefined}
    onChange={setValue}
    {isRequired}
    {isInvalid}
    {type}
    showMessage={!!isInvalid}
    value={previousValue}
  >
    <Policies
      {callback}
      key={inputName ?? ''}
      label={prompt ?? ''}
      messageKey="valueRequirements"
    />
  </Input>
{/key}
