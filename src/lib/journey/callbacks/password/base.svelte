<script lang="ts">
  import type {
    PasswordCallback,
    ValidatedCreatePasswordCallback,
  } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import ConfirmInput from './confirm-input.svelte';
  import EyeIcon from '$components/icons/eye-icon.svelte';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type { Maybe } from '$lib/interfaces';
  import type { CallbackMetadata } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';

  export let callback: PasswordCallback | ValidatedCreatePasswordCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let key: string;
  export let isInvalid = false;
  export let isRequired = false;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;
  const showPassword = style.showPassword;
  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: Maybe<boolean> = undefined;
  export let validationFailure = '';

  let confirmValue: Maybe<string>;
  let callbackType: string;
  let doPasswordsMatch: Maybe<boolean>;
  let isVisible = false;
  let resetValue = false;
  let savedValue = '';
  let textInputLabel: string;
  let type: 'password' | 'text' = 'password';
  let value: string;

  /**
   * @function confirmInput - ensures the second password input matches the first
   * @param event
   */
  function confirmInput(val: Maybe<string>) {
    confirmValue = val;
  }
  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    value = (event.target as HTMLInputElement).value;
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(value);
    savedValue = String(value);
  }
  /**
   * @function toggleVisibility - toggles the password from masked to plaintext
   */
  function toggleVisibility() {
    isVisible = !isVisible;
    type = isVisible ? 'text' : 'password';
  }

  $: {
    callbackType = callback.getType();
    key = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue() as string;

    /**
     * `savedValue` represents what the user set after blur (local component state)
     * `value` represents what's in the callback (empties from AM response)
     *
     * This unique combination is what produces the most reliable reset flag
     */
    resetValue = !!savedValue && value === '';

    /**
     * Only assign a boolean if the confirm input has an actual value.
     */
    doPasswordsMatch = confirmValue !== undefined ? confirmValue === value : undefined;
  }
</script>

{#key callback}
  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    hasRightIcon={style.showPassword === 'button' ? true : false}
    {key}
    label={interpolate(textToKey(callbackType), null, textInputLabel)}
    message={validationFailure || (isRequired ? interpolate('inputRequiredError') : undefined)}
    onChange={setValue}
    {isInvalid}
    {isRequired}
    {showMessage}
    {type}
    value={typeof value === 'string' ? value : ''}
  > 
    <svelte:fragment slot="input-button">
      {#if showPassword === "button"}
        <button
        class={`tw_password-button dark:tw_password-button_dark tw_focusable-element tw_input-base dark:tw_input-base_dark`}
        on:click={toggleVisibility}
        type="button"
        >
          <EyeIcon classes="tw_password-icon dark:tw_password-icon_dark" visible={isVisible}>
            <T key="showPassword" />
          </EyeIcon>
        </button>
      {/if}
    </svelte:fragment>
    <slot />
  </Input>

  {#if showPassword === "checkbox"}
    <div class="tw_w-full tw_input-spacing" >
      <Checkbox isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
        isInvalid={false}
        key = {key + style.showPassword}
        onChange={toggleVisibility}
        value={false}
      >
        Show Password
      </Checkbox>
    </div>
  {/if}
  {#if callbackMetadata?.platform?.confirmPassword}
    <ConfirmInput
      forceValidityFailure={doPasswordsMatch === false}
      passwordsDoNotMatch={doPasswordsMatch === false}
      {key}
      isRequired={value.length > 0}
      onChange={confirmInput}
      {resetValue}
      showMessage={doPasswordsMatch === false}
      {style}
      isFirstInvalidInput = {callbackMetadata?.derived.isFirstInvalidInput || false}
    />
  {/if}
  
{/key}
