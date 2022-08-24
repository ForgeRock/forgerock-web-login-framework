<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/utilities/i18n.utilities';

  export let callback: NameCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

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
  label={interpolate(callbackType, null, textInputLabel)}
  onChange={setValue}
  type="text"
  value={typeof value === 'string' ? value : ''}
/>
