<script lang="ts">
  import type { AttributeInputCallback } from '@forgerock/javascript-sdk';

  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';

  export let callback: AttributeInputCallback<boolean>;
  export let inputName = '';

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const prompt = callback.getPrompt();
  const value = callback.getInputValue() as boolean;

  function setValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue((event.target as HTMLInputElement).checked);
  }
</script>

<Checkbox key={inputName} label={prompt} onChange={setValue} {value} />
