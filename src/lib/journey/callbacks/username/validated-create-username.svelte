<script lang="ts">
  import type { ValidatedCreateUsernameCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

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
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: ValidatedCreateUsernameCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string;
  let inputName: string;
  let isInvalid: boolean;
  let isRequired: boolean;
  let prompt: string;
  let value: unknown;
  let validationFailures: FailedPolicy[];

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `validated-name=${callbackMetadata?.idx}`;
    isRequired = isInputRequired(callback);
    prompt = callback.getPrompt();
    value = callback?.getInputValue();
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

{#key callback}
  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
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
{/key}
