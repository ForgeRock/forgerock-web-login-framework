<script lang="ts">
  import type { ConfirmationCallback } from '@forgerock/javascript-sdk';

  import Button from '$components/primitives/button/button.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import Grid from '$components/primitives/grid/grid.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const style: Style = {};

  export let callback: never;
  export let displayType: Maybe<'buttons' | 'select'> = null;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: Maybe<StepMetadata>;


  let buttonStyle: 'outline' | 'primary' | 'secondary' | undefined;
  let defaultChoice: number;
  let inputName: string;
  let label: string;
  let options: { value: string; text: string }[];
  let typedCallback: ConfirmationCallback;

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(index: number) {
    typedCallback.setOptionIndex(index);
    if (callbackMetadata) { callbackMetadata.isReadyForSubmission = true; }
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
    typedCallback.setOptionIndex(Number((event.target as HTMLSelectElement).value));
  }

  // TODO: use selfSubmitFunction to communicate to step component that this callback is ready

  $: {
    typedCallback = callback as ConfirmationCallback;
    inputName = typedCallback?.payload?.input?.[0].name || `confirmation-${callbackMetadata?.idx}`;
    options = typedCallback.getOptions().map((option, index) => ({ value: `${index}`, text: option }));
    defaultChoice = typedCallback.getDefaultOption();
    label = interpolate(textToKey('pleaseConfirm'), null, 'Please Confirm');

    if (displayType === 'select' || !stepMetadata?.isStepSelfSubmittable) {
      // Since the user needs to confirm, add this non-value to force selection
      options.unshift({ value: '', text: label });
    } else if (options.length === 1) {
      buttonStyle = 'outline';
    } else {
      buttonStyle = 'secondary';
    }
  }
</script>

{#if displayType === 'select' || !stepMetadata?.isStepSelfSubmittable}
  <Select
    isFirstInvalidInput={callbackMetadata?.isFirstInvalidInput || false}
    isRequired={false}
    key={inputName}
    {label}
    onChange={setOptionValue}
    {options}
  />
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
