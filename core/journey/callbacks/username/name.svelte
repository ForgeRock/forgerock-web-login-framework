<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import { interpolate, textToKey } from '$core/_utilities/i18n.utilities';

  import type { NameCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  interface Props {
    callback: NameCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback, callbackMetadata, style = {} }: Props = $props();

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string | undefined = $state();
  let inputName: string | undefined = $state();
  let textInputLabel: string | undefined = $state();
  let value: unknown | undefined = $state();

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $effect.pre(() => {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `name-${callbackMetadata?.idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
  });
</script>

{#key callback}
  <Input
    autocomplete={callbackMetadata?.derived?.autocompleteValues}
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    key={inputName}
    label={interpolate(textToKey(textInputLabel || callbackType), null, textInputLabel)}
    onChange={setValue}
    type="text"
    showMessage={false}
    value={typeof value === 'string' ? value : ''}
  />
{/key}
