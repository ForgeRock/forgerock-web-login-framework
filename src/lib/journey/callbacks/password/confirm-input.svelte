<script lang="ts">
  import type { z } from 'zod';

  import EyeIcon from '$components/icons/eye-icon.svelte';
  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type { Maybe } from '$lib/interfaces';
  import type { styleSchema } from '$lib/style.store';

  export let forceValidityFailure = false;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let isInvalid = false;
  export let isRequired = true;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: Maybe<boolean> = undefined;

  let isVisible = false;
  let type: 'password' | 'text' = 'password';
  let value: unknown;
  /**
   * @function toggleVisibility - toggles the password from masked to plaintext
   */
  function toggleVisibility() {
    isVisible = !isVisible;
    type = isVisible ? 'text' : 'password';
  }
</script>

<Input
  {forceValidityFailure}
  isFirstInvalidInput={false}
  hasRightIcon={true}
  key={`${key}-confirm`}
  label={interpolate('confirmPassword', null, 'Confirm Password')}
  message={isInvalid ? interpolate('passwordConfirmationError', null, 'Passwords do not match') : undefined}
  {onChange}
  {isInvalid}
  {isRequired}
  {showMessage}
  {type}
  value={typeof value === 'string' ? value : ''}
>
  <button
    class={`tw_password-button dark:tw_password-button_dark tw_focusable-element tw_input-base dark:tw_input-base_dark`}
    on:click={toggleVisibility}
    slot="input-button"
    type="button"
  >
    <EyeIcon classes="tw_password-icon dark:tw_password-icon_dark" visible={isVisible}
      ><T key="showPassword" /></EyeIcon
    >
  </button>
  <slot />
</Input>
