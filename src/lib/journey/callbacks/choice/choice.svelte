<script lang="ts">
  import type { ChoiceCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import RadioAnimated from '$components/compositions/radio/animated.svelte';
  import RadioStandard from '$components/compositions/radio/standard.svelte';
  import SelectFloating from '$components/compositions/select-floating/floating-label.svelte';
  import SelectStacked from '$components/compositions/select-stacked/stacked-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export let style: z.infer<typeof styleSchema> = {};

  const Radio = style.checksAndRadios === 'standard' ? RadioStandard : RadioAnimated;
  const Select = style.labels === 'stacked' ? SelectStacked : SelectFloating;

  export let callback: ChoiceCallback;
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

  $: {
    /** *************************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for getting values
     * --------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for accessing values from the callbacks received from AM
     ************************************************************************* */
    choiceOptions = callback.getChoices()?.map((text, idx) => ({
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
    defaultChoice = `${callback.getDefaultChoice()}` || null;
    inputName = callback?.payload?.input?.[0].name || `choice-${callbackMetadata?.idx}`;
    prompt = callback.getPrompt();
    label = interpolate(textToKey(prompt), null, prompt);
  }
</script>

{#if callbackMetadata?.platform?.displayType === 'radio'}
  <Radio
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    defaultOption={defaultChoice}
    isRequired={false}
    key={inputName}
    groupLabel={prompt}
    onChange={setValue}
    name={inputName}
    options={choiceOptions}
  />
{:else}
  <Select
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    defaultOption={defaultChoice}
    isRequired={false}
    key={inputName}
    {label}
    onChange={setValue}
    options={choiceOptions}
  />
{/if}
