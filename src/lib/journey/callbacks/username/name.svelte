<script lang="ts">
  import Input from "$components/compositions/input-floating/floating-label.svelte";

  export let callback;
  export let inputName;

  const existingValue = callback?.getInputValue();
  const textInputLabel = callback.getPrompt();

  function setValue(event) {
    callback.setInputValue(event.target.value);
  }
</script>

<Input key={inputName} label={textInputLabel} onChange={setValue} type="text" value={existingValue} />
