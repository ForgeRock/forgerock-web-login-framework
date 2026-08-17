<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import EyeIcon from '$components/icons/eye-icon.svelte';
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';

  import type { Snippet } from 'svelte';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';

  interface Props {
    forceValidityFailure?: boolean;
    passwordsDoNotMatch?: boolean;
    isRequired?: boolean;
    key: string;
    onChange: (val: Maybe<string>) => void;
    resetValue: boolean;
    style?: z.infer<typeof styleSchema>;
    isFirstInvalidInput: boolean;
    // Below needs to be `undefined` to be optional and allow default value in Message component
    showMessage?: Maybe<boolean>;
    children?: Snippet;
  }

  let {
    forceValidityFailure = false,
    passwordsDoNotMatch = false,
    isRequired = false,
    key,
    onChange,
    resetValue,
    style = {},
    isFirstInvalidInput,
    showMessage = undefined,
    children,
  }: Props = $props();
  const Input = style.labels === 'stacked' ? Stacked : Floating;
  const showPassword = style.showPassword;

  let isVisible = $state(false);
  let type: 'password' | 'text' = $state('password');
  let value: Maybe<string> | undefined = $state();
  let message = $state('');

  function onChangeWrapper(event: Event) {
    value = (event.target as HTMLInputElement)?.value;
    // TODO: revisit this logic to avoid unnecessary ternary
    onChange(typeof value === 'string' ? value : undefined);
  }
  /**
   * @function toggleVisibility - toggles the password from masked to plaintext
   */
  function toggleVisibility() {
    isVisible = !isVisible;
    type = isVisible ? 'text' : 'password';
  }

  $effect.pre(() => {
    if (resetValue) {
      value = undefined;
      onChange(value);
    }
    if (passwordsDoNotMatch) {
      message = interpolate('passwordConfirmationError', null, 'Passwords do not match');
    } else if (isRequired) {
      message = interpolate('requiredField', null, 'This field is required');
    } else {
      message = '';
    }
  });
</script>

<Input
  {forceValidityFailure}
  isFirstInvalidInput={false}
  hasRightIcon={style.showPassword === 'button' ? true : false}
  key={`${key}-confirm`}
  label={interpolate('confirmPassword', null, 'Confirm Password')}
  {message}
  onChange={onChangeWrapper}
  isInvalid={passwordsDoNotMatch}
  {isRequired}
  {showMessage}
  {type}
  value={typeof value === 'string' ? value : ''}
  ><svelte:fragment slot="input-button">
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
      {isFirstInvalidInput}
      isInvalid={false}
      key={key + style.showPassword}
      onChange={toggleVisibility}
      value={false}
    >
      Show Password
    </Checkbox>
  </div>
{/if}
