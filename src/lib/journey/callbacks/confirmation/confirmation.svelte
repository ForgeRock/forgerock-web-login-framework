<script lang="ts">
  import type { ConfirmationCallback } from '@forgerock/javascript-sdk';

  import Button from '$components/primitives/button/button.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import Grid from '$components/primitives/grid/grid.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';

  export let callback: ConfirmationCallback;
  export let displayType: 'buttons' | 'select' = 'select';
  export let firstInvalidInput: boolean;
  export let idx: number;

  const inputName = callback?.payload?.input?.[0].name || `confirmation-${idx}`;

  let label = interpolate(textToKey('pleaseConfirm'), null, 'Please Confirm');
  let options: { value: string; text: string }[];
  let defaultChoice: number;

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(index: number) {
    callback.setOptionIndex(index);
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

  $: {
    options = callback.getOptions().map((option, index) => ({ value: `${index}`, text: option }));
    defaultChoice = callback.getDefaultOption();

    if (displayType === 'select') {
      // Since the user needs to confirm, add this non-value to force selection
      options.unshift({ value: '', text: label });
    }
  }
</script>

{#if displayType === 'select'}
  <Select
    {firstInvalidInput}
    isRequired={false}
    key={inputName}
    {label}
    onChange={setOptionValue}
    {options}
  />
{:else}
  <Grid num={options.length}>
    {#if options.length === 1}
      <!-- Dummy element to push single button to right -->
      <span />
    {/if}
    {#each options as opt, index}
      <Button
        style={defaultChoice === index ? 'secondary' : 'primary'}
        type="button"
        width="auto"
        onClick={() => setBtnValue(index)}
      >
        {opt}
      </Button>
    {/each}
  </Grid>
{/if}
