<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/utilities/i18n.utilities';

  export let callback: NameCallback;
  export let idx: number;

  const callbackType = callback.getType();
  const inputName = callback?.payload?.input?.[0].name || `name-${idx}`;
  const unknownValue = callback?.getInputValue();
  const textInputLabel = callback.getPrompt();

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }
</script>

<Input
  key={inputName}
  label={interpolate(callbackType, null, textInputLabel)}
  onChange={setValue}
  type="text"
  value={typeof unknownValue === 'string' ? unknownValue : ''}
/>
