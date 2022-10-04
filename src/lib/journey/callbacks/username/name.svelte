<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';

  import type { Maybe } from '$lib/interfaces';

  export let callback: NameCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;
  export let labelType: Maybe<'floating' | 'stacked'> = 'floating';

  const Input = labelType === 'floating' ? Floating : Stacked;

  let callbackType = callback.getType();
  let inputName = callback?.payload?.input?.[0].name || `name-${idx}`;
  let textInputLabel = callback.getPrompt();
  let value = callback?.getInputValue();

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  $: {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `name-${idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
  }
</script>

<Input
  {firstInvalidInput}
  key={inputName}
  label={interpolate(textToKey(callbackType), null, textInputLabel)}
  onChange={setValue}
  type="text"
  showMessage={false}
  value={typeof value === 'string' ? value : ''}
/>
