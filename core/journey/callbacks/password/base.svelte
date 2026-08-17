<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import T from '$components/_utilities/locale-strings.svelte';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import EyeIcon from '$components/icons/eye-icon.svelte';
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';
  import { interpolate, textToKey } from '$core/_utilities/i18n.utilities';
  import ConfirmInput from './confirm-input.svelte';

  import type {
    PasswordCallback,
    ValidatedCreatePasswordCallback,
  } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type { CallbackMetadata } from '$journey/journey.interfaces';


  const Input = style.labels === 'stacked' ? Stacked : Floating;
  const showPassword = style.showPassword;
  
  interface Props {
    callback: PasswordCallback | ValidatedCreatePasswordCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    key: string;
    isInvalid?: boolean;
    isRequired?: boolean;
    style?: z.infer<typeof styleSchema>;
    // Below needs to be `undefined` to be optional and allow default value in Message component
    showMessage?: Maybe<boolean>;
    validationFailure?: string;
    children?: import('svelte').Snippet;
  }

  let {
    callback,
    callbackMetadata,
    key = $bindable(),
    isInvalid = false,
    isRequired = false,
    style = {},
    showMessage = undefined,
    validationFailure = '',
    children
  }: Props = $props();

  let confirmValue: Maybe<string> = $state();
  let callbackType: string = $state();
  let doPasswordsMatch: Maybe<boolean> = $state();
  let isVisible = $state(false);
  let resetValue = $state(false);
  let savedValue = $state('');
  let textInputLabel: string = $state();
  let type: 'password' | 'text' = $state('password');
  let value: string = $state();

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

  run(() => {
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
  });
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
    <!-- @migration-task: migrate this slot by hand, `input-button` is an invalid identifier -->
  <svelte:fragment slot="input-button">
      {#if showPassword === 'button'}
        <button
          class="tw_password-button dark:tw_password-button_dark tw_focusable-element tw_input-base dark:tw_input-base_dark"
          onclick={toggleVisibility}
          type="button"
        >
          <EyeIcon classes="tw_password-icon dark:tw_password-icon_dark" visible={isVisible}>
            <T key="showPassword" />
          </EyeIcon>
        </button>
      {/if}
    </svelte:fragment>
    {@render children?.()}
  </Input>

  {#if showPassword === 'checkbox'}
    <div class="tw_w-full tw_input-spacing">
      <Checkbox
        isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
        isInvalid={false}
        key={key + style.showPassword}
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
      isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    />
  {/if}
{/key}
