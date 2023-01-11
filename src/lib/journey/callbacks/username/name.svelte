<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: Style = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType: string;
  let inputName: string;
  let textInputLabel: string;
  let typedCallback: NameCallback;
  let value: unknown;

  function setValue(event: Event) {
    typedCallback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    typedCallback = callback as NameCallback;
    callbackType = typedCallback.getType();
    inputName = typedCallback?.payload?.input?.[0].name || `name-${callbackMetadata?.idx}`;
    textInputLabel = typedCallback.getPrompt();
    value = typedCallback?.getInputValue();
  }
</script>

<Input
  isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
  key={inputName}
  label={interpolate(textToKey(callbackType), null, textInputLabel)}
  onChange={setValue}
  type="text"
  showMessage={false}
  value={typeof value === 'string' ? value : ''}
/>
