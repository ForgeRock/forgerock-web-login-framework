<script lang="ts">
  import type { ConfirmationCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import Grid from '$components/primitives/grid/grid.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const style: z.infer<typeof styleSchema> = {};

  export let callback: ConfirmationCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: Maybe<StepMetadata>;

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;

  let buttonStyle: 'outline' | 'primary' | 'secondary' | undefined;
  let defaultChoice: number = callback.getDefaultOption();
  let inputName: string;
  let label: string;
  let options: { value: string; text: string }[];

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(index: number) {
    callback.setOptionIndex(index);
    if (callbackMetadata) { callbackMetadata.derived.isReadyForSubmission = true; }
    selfSubmitFunction && selfSubmitFunction();
  }

  /**
   * @function setOptionValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setOptionValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setOptionIndex(Number((event.target as HTMLSelectElement).value));
  }

  /**
   * @function setOptionValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setCheckboxValue(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    const value = (event.target as HTMLInputElement).checked;
    if (value) {
      callback.setOptionIndex(0);
    } else {
      // If checkbox is unset, revert back to default choice
      callback.setOptionIndex(defaultChoice);
    }
  }

  // TODO: use selfSubmitFunction to communicate to step component that this callback is ready

  $: {
    inputName = callback?.payload?.input?.[0].name || `confirmation-${callbackMetadata?.idx}`;
    options = callback.getOptions().map((option, index) => ({ value: `${index}`, text: option }));
    defaultChoice = callback.getDefaultOption();
    label = interpolate(textToKey('pleaseConfirm'), null, 'Please Confirm');

    if (callbackMetadata?.platform?.showOnlyPositiveAnswer) {
      // The positive option is always first in the `options` array
      options = options.slice(0, 1);
    }

    if (callback.getInputValue() === 0) {
      /**
       * If input value is 0 (falsy value), then let's make sure it's set to the default value
       * There's a case when the input value is 100, and for that we leave it at 100
       */
      callback.setOptionIndex(defaultChoice);
    }

    if (!stepMetadata?.derived.isStepSelfSubmittable && options.length > 1) {
      // Since the user needs to confirm, add this empty `value` to force selection
      options.unshift({ value: '', text: label });
    } else if (options.length === 1) {
      buttonStyle = 'outline';
    } else {
      buttonStyle = 'secondary';
    }
  }
</script>

<!-- Only render confirmation if NOT currently on 'OneTimePassword' stage -->
{#if stepMetadata?.platform?.stageName !== 'OneTimePassword'}
  {#if !stepMetadata?.derived.isStepSelfSubmittable}
    {#if options.length > 1}
      <Select
        isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
        isRequired={false}
        key={inputName}
        {label}
        onChange={setOptionValue}
        {options}
      />
    {:else}
      <Checkbox
        isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
        isInvalid={false}
        key={inputName}
        onChange={setCheckboxValue}
        value={false}
      >
        {options[0].text}
    </Checkbox>
    {/if}
  {:else}
    <Grid num={options.length}>
      {#each options as opt}
        <Button
          style={options.length > 1 && defaultChoice === Number(opt.value) ? 'primary' : buttonStyle}
          type="button"
          width="auto"
          onClick={() => setBtnValue(Number(opt.value))}
        >
          {opt.text}
        </Button>
      {/each}
    </Grid>
  {/if}
{/if}
