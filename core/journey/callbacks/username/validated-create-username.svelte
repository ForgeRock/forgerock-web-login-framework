<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import { interpolate, textToKey } from '$core/_utilities/i18n.utilities';
  import {
    getValidationFailures,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type { ValidatedCreateUsernameCallback } from '@forgerock/journey-client/types';
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
    callback: ValidatedCreateUsernameCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback, callbackMetadata, style = {} }: Props = $props();

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string = $state();
  let inputName: string = $state();
  let isInvalid: boolean = $state();
  let isRequired: boolean = $state();
  let prompt: string = $state();
  let value: unknown = $state();
  let validationFailures: FailedPolicy[] = $state();

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  run(() => {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `validated-name=${callbackMetadata?.idx}`;
    isRequired = isInputRequired(callback);
    prompt = callback.getPrompt();
    value = callback?.getInputValue();
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  });
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
