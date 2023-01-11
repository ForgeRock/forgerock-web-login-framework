<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';

  import Radio from '$components/compositions/radio/animated.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: Style = {};

  export let callback: never;
  export let displayType: 'radio' | 'select' = 'select';
  export let callbackMetadata: Maybe<CallbackMetadata>;

  let choiceOptions: { value: string; text: string }[];
  let inputName: string;
  /**
   * Since locale content keys for the choice component are built off of the
   * values, there will not be any existing key-value pairs in the provided
   * content. The third argument here, the original value, is what will be
   * displayed. If you want to localize it, you'll need to add content keys
   * in the locale file for that to override the original value.
   */
  let label: string;
  let prompt: string;
  let defaultChoice: Maybe<string>;
  let typedCallback: ChoiceCallback;

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
    typedCallback.setChoiceIndex(Number((event.target as HTMLSelectElement).value));
  }

  $: {
    typedCallback = callback as ChoiceCallback
    /** *************************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for getting values
     * --------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for accessing values from the callbacks received from AM
     ************************************************************************* */
    choiceOptions = typedCallback.getChoices()?.map((text, idx) => ({
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
    defaultChoice = `${typedCallback.getDefaultChoice()}` || null;
    inputName = typedCallback?.payload?.input?.[0].name || `choice-${callbackMetadata?.idx}`;
    prompt = typedCallback.getPrompt();
    label = interpolate(textToKey(prompt), null, prompt);
  }
</script>

{#if displayType === 'select'}
  <Select
    isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
    defaultOption={defaultChoice}
    isRequired={false}
    key={inputName}
    {label}
    onChange={setValue}
    options={choiceOptions}
  />
{:else}
  <Radio
    isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
    defaultOption={defaultChoice}
    isRequired={false}
    key={inputName}
    groupLabel={prompt}
    onChange={setValue}
    name={inputName}
    options={choiceOptions}
  />
{/if}
