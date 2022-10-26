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

  export let callback: NameCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

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
    inputName = callback?.payload?.input?.[0].name || `name-${callbackMetadata.idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
  }
</script>

<Input
  isFirstInvalidInput={callbackMetadata.isFirstInvalidInput}
  key={inputName}
  label={interpolate(textToKey(callbackType), null, textInputLabel)}
  onChange={setValue}
  type="text"
  showMessage={false}
  value={typeof value === 'string' ? value : ''}
/>