<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Select from '$components/compositions/select-floating/floating-label.svelte';

  export let callback: ChoiceCallback;
  export let idx: number;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const choiceOptions = callback
    .getChoices()
    ?.map((label, index) => ({ text: label, value: index }));
  const defaultChoice = callback.getDefaultChoice();
  const inputName = callback?.payload?.input?.[0].name || `choice-${idx}`;
  const prompt = callback.getPrompt();

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setChoiceIndex(Number((event.target as HTMLSelectElement).value));
  }
</script>

<Select
  defaultOption={defaultChoice}
  isRequired={false}
  key={inputName}
  label={prompt}
  onChange={setValue}
  options={choiceOptions}
/>
