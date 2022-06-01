<script lang="ts">
  import type { PasswordCallback, ValidatedCreatePasswordCallback } from "@forgerock/javascript-sdk";

  import EyeIcon from "$components/icons/eye-icon.svelte";
  import Input from "$components/primitives/input/floating-label.svelte";

  export let callback: PasswordCallback | ValidatedCreatePasswordCallback;
  export let inputName: string;
  export let isRequired = false;
  export let validationFailure = '';

  const textInputLabel = callback.getPrompt();

  let isVisible = false;
  let type: 'password' | 'text' = 'password';

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(event.target.value);
  }
  /**
   * @function toggleVisibility - toggles the password from masked to plaintext
   */
  function toggleVisibility() {
    isVisible = !isVisible;
    type = isVisible ? 'text' : 'password';
  }
</script>

<Input hasRightIcon={true} key={inputName} label={textInputLabel} onChange={setValue} {isRequired} {type}>
  <button
    class={`tw_align-middle tw_bg-white tw_border-gray tw_border-r tw_rounded-r tw_border-y tw_items-center tw_flex tw_leading-6 tw_py-1 tw_px-3 tw_text-center`}
    on:click={toggleVisibility}
    type="button"
  >
    <EyeIcon classes="tw_text-gray tw_fill-current" visible={isVisible}>Show Password</EyeIcon>
  </button>
  {#if validationFailure}
    <div class="tw_w-full">{validationFailure}</div>
  {/if}
</Input>
