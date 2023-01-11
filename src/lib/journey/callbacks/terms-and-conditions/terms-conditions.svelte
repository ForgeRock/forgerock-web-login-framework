<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Link from '$components/primitives/link/link.svelte';
  import { links } from '$lib/links.store';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const` prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: Style = {};

  export let callback: never;
  export let checkAndRadioType: 'animated' | 'standard' = 'animated';
  export let callbackMetadata: CallbackMetadata;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const Checkbox = checkAndRadioType === 'standard' ? Standard : Animated;

  let inputName: string;
  let typedCallback: TermsAndConditionsCallback;

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
    typedCallback.setAccepted((event.target as HTMLInputElement).checked);
  }

  $: {
    typedCallback = callback as TermsAndConditionsCallback;
    inputName = typedCallback?.payload?.input?.[0].name || `terms-${callbackMetadata.idx}`;
  }
</script>

{#if $links?.termsAndConditions}
  <Link classes="tw_block tw_mb-4" href={$links?.termsAndConditions} target="_blank">
    {interpolate('termsAndConditionsLinkText')}
  </Link>
  <Checkbox
    isFirstInvalidInput={callbackMetadata.isFirstInvalidInput}
    key={inputName}
    onChange={setValue}
    value={false}
  >
    <T key="termsAndConditions" />
  </Checkbox>
{:else}
  <p class=" tw_text-error-dark dark:tw_text-error-light tw_input-spacing">
    Error: Configuration is missing <code>termsAndConditions</code> URL.
  </p>
{/if}
