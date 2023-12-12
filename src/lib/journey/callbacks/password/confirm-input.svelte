<script lang="ts">
  import type { z } from 'zod';

  import EyeIcon from '$components/icons/eye-icon.svelte';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type { Maybe } from '$lib/interfaces';
  import type { styleSchema } from '$lib/style.store';
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';

  export let forceValidityFailure = false;
  export let passwordsDoNotMatch = false;
  export let isRequired = false;
  export let key: string;
  export let onChange: (val: Maybe<string>) => void;
  export let resetValue: boolean;
  export let style: z.infer<typeof styleSchema> = {};
  export let isFirstInvalidInput: boolean;

  const Input = style.labels === 'stacked' ? Stacked : Floating;
    const showPassword = style.showPassword;

  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: Maybe<boolean> = undefined;

  let isVisible = false;
  let type: 'password' | 'text' = 'password';
  let value: Maybe<string>;
  let message = '';

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

  $: {
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
  }
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
      <Checkbox 
        {isFirstInvalidInput}
        isInvalid={false}
        key = {key + style.showPassword}
        onChange={toggleVisibility}
        value={false}
      >
        Show Password
      </Checkbox>
    </div>
  {/if}
