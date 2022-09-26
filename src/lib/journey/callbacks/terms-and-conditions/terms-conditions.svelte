<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  export let callback: TermsAndConditionsCallback;
  export let checkAndRadioType: 'animated' | 'standard' = 'animated';
  export let firstInvalidInput: boolean;
  export let idx: number;

  // TODO: Component needs a UX story to be complete

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const Checkbox = checkAndRadioType === 'standard' ? Standard : Animated;
  const inputName = callback?.payload?.input?.[0].name || `terms-${idx}`;
  const terms = callback.getTerms();

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
    callback.setAccepted((event.target as HTMLInputElement).checked);
  }
</script>

<Checkbox {firstInvalidInput} key={inputName} onChange={setValue} value={false}>
  <T key="termsAndConditions" />
</Checkbox>
