<script lang="ts">
  import {
    getInputTypeFromPolicies,
    isInputRequired,
    type FailedPolicy,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import { getValidationFailures } from '$journey/callbacks/_utilities/callback.utilities';

  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';
  import type { StringDict } from '@forgerock/javascript-sdk/src/shared/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: AttributeInputCallback<string>;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let inputName: string;
  let isRequired: boolean;
  let outputName: string;
  let policies: StringDict<unknown>;
  let previousValue: string;
  let prompt: string;
  let type: 'email' | 'text';
  let validationFailures: FailedPolicy[];
  let isInvalid: boolean;

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
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
  }
</script>

{#key callback}
  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
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
{/key}
