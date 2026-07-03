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
  import type { FullAutoFill } from 'svelte/elements';
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

  export let callback: NameCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string;
  let inputName: string;
  let textInputLabel: string;
  let value: unknown;
  let autocomplete: FullAutoFill | undefined;

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `name-${callbackMetadata?.idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
    // Honor the HTML autocomplete tokens configured on the AM node (e.g.
    // "username webauthn" to opt the field into passkey autofill). When the
    // admin has set no values, the attribute is omitted.
    const autocompleteValues = callback.getOutputByName<string[]>('autocompleteValues', []);
    // Cast at the boundary: the tokens are free-form AM config, but the DOM
    // attribute is typed as the stricter FullAutoFill union.
    autocomplete = autocompleteValues.length
      ? (autocompleteValues.join(' ') as FullAutoFill)
      : undefined;
  }
</script>

{#key callback}
  <Input
    {autocomplete}
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    key={inputName}
    label={interpolate(textToKey(textInputLabel || callbackType), null, textInputLabel)}
    onChange={setValue}
    type="text"
    showMessage={false}
    value={typeof value === 'string' ? value : ''}
  />
{/key}
