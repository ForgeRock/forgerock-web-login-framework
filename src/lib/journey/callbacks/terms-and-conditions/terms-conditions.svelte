<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: TermsAndConditionsCallback;
  export let checkAndRadioType: 'animated' | 'standard' = 'animated';
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  // TODO: Component needs a UX story to be complete

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const Checkbox = checkAndRadioType === 'standard' ? Standard : Animated;

  let inputName: string;
  // Currently NOT supporting the render of the full terms
  // let terms = callback.getTerms();

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

  $: {
    inputName = callback?.payload?.input?.[0].name || `terms-${callbackMetadata.idx}`;
  }
</script>

<Checkbox
  isFirstInvalidInput={callbackMetadata.isFirstInvalidInput}
  key={inputName}
  onChange={setValue}
  value={false}
>
  <T key="termsAndConditions" />
</Checkbox>
