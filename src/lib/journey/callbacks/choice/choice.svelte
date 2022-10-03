<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';

  export let callback: ChoiceCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const choiceOptions = callback.getChoices()?.map((text, idx) => ({
    /**
     * Since locale content keys for the choice component are built off of the
     * values, there will not be any existing key-value pairs in the provided
     * content. The third argument here, the original value, is what will be
     * displayed. If you want to localize it, you'll need to add content keys
     * in the locale file for that to override the original value.
     */
    text: interpolate(textToKey(text), null, text),
    value: `${idx}`,
  }));
  const defaultChoice = `${callback.getDefaultChoice()}` || null;
  const inputName = callback?.payload?.input?.[0].name || `choice-${idx}`;
  const prompt = callback.getPrompt();

  /**
   * Since locale content keys for the choice component are built off of the
   * values, there will not be any existing key-value pairs in the provided
   * content. The third argument here, the original value, is what will be
   * displayed. If you want to localize it, you'll need to add content keys
   * in the locale file for that to override the original value.
   */
  const label = interpolate(textToKey(prompt), null, prompt);

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
  {firstInvalidInput}
  defaultOption={defaultChoice}
  isRequired={false}
  key={inputName}
  {label}
  onChange={setValue}
  options={choiceOptions}
/>
