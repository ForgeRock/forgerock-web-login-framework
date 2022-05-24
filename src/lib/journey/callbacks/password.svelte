<script>
  import Input from "$components/primitives/input/input.svelte";

  export let callback;
  export let inputName;

  const existingValue = callback?.getInputValue();
  const textInputLabel = callback.getPrompt();
  const stringAttributeName = callback.getName && callback.getName();

  function setValue(event) {
    callback.setInputValue(event.target.value);
  }
</script>

<Input key="Password" label={textInputLabel} onChange={setValue} type="password" />

