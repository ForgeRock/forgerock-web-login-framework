<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';

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

  export let callback: NameCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string;
  let inputName: string;
  let textInputLabel: string;
  let value: unknown;

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `name-${callbackMetadata?.idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
  }
</script>

{#key callback}
  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    key={inputName}
    label={interpolate(textToKey(textInputLabel || callbackType), null, textInputLabel)}
    onChange={setValue}
    type="text"
    showMessage={false}
    value={typeof value === 'string' ? value : ''}
  />
{/key}
