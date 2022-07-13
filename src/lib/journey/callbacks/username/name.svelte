<script lang="ts">
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';

  export let callback: NameCallback;
  export let idx: number;

  const inputName = callback?.payload?.input?.[0].name || `name-${idx}`;
  const unknownValue = callback?.getInputValue();
  const textInputLabel = callback.getPrompt();

  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }
</script>

<Input
  key={inputName}
  label={textInputLabel}
  onChange={setValue}
  type="text"
  value={typeof unknownValue === 'string' ? unknownValue : ''}
/>
