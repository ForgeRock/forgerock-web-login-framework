<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { callbackType } from '@forgerock/journey-client';
  import { tick } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

  import type {
    HiddenValueCallback,
    JourneyStep,
    TextOutputCallback,
  } from '@forgerock/journey-client/types';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let step: JourneyStep;

  const OTP_LENGTH = 6;
  const formFailureMessageId = 'adminInviteVerifyCodeFailureMessage';
  const formHeaderId = 'adminInviteVerifyCodeHeader';
  const formElementId = 'adminInviteVerifyCodeForm';

  $: formMessageKey = convertStringToKey(form?.message);
  $: formAriaDescriptor = form?.message ? formFailureMessageId : formHeaderId;
  $: formNeedsFocus = !form?.message;

  let hiddenValueCb: HiddenValueCallback | null = null;
  let otpHasError = false;
  let otpDigits: string[] = Array.from({ length: OTP_LENGTH }, () => '');
  let otpInputs: HTMLInputElement[] = [];

  function extractDigits(clipboardData: DataTransfer | null): string[] {
    const digits = (clipboardData?.getData('text') ?? '').replace(/\D/g, '').split('');
    return Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? '');
  }

  function handleOtpInput(index: number) {
    otpDigits[index] = otpDigits[index].replace(/\D/g, '');
    if (otpDigits[index] !== '' && index < OTP_LENGTH - 1) {
      otpInputs[index + 1].focus();
    }
  }

  function handleOtpKeyup(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && index > 0 && otpDigits[index] === '') {
      otpInputs[index - 1].focus();
    }
  }

  async function handleOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    otpDigits = extractDigits(event.clipboardData);
    await tick();
    const nextEmpty = otpDigits.findIndex((digit) => digit === '');
    if (nextEmpty >= 0) {
      otpInputs[nextEmpty].focus();
    } else {
      otpInputs[OTP_LENGTH - 1].focus();
    }
  }

  async function submit(value: string) {
    hiddenValueCb?.setInputValue(value);
    await tick();
    form?.submit();
  }

  $: otpComplete = otpDigits.every((digit) => /^\d$/.test(digit));

  // AM toggles the retry warning via if(false)/if(true) in the script:
  // first load: if (false) { ... p1aic-otp-retry-warning ... }
  // retry:      if (true)  { ... p1aic-otp-retry-warning ... }
  $: {
    hiddenValueCb =
      (step.getCallbacksOfType(callbackType.HiddenValueCallback) as HiddenValueCallback[]).find(
        (cb) => (cb.getOutputByName('id', '') as string) === 'p1aic-otp-answer',
      ) ?? null;

    otpHasError = (
      step.getCallbacksOfType(callbackType.TextOutputCallback) as TextOutputCallback[]
    ).some(
      (cb) =>
        cb.getMessageType() === '4' &&
        /if \(true\)\s*\{[^}]*p1aic-otp-retry-warning/.test(cb.getMessage()),
    );

    if (otpHasError) {
      otpDigits = Array.from({ length: OTP_LENGTH }, () => '');
      tick().then(() => otpInputs[0]?.focus());
    }
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy={formAriaDescriptor}
  id={formElementId}
  needsFocus={formNeedsFocus}
  onSubmitWhenValid={() => form?.submit()}
>
  {#if form?.message}
    <Alert id={formFailureMessageId} needsFocus={!!form?.message} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#if form?.icon && componentStyle !== 'inline'}
    <div class="tw_flex tw_justify-center tw_mb-6">
      <img alt="Ping Identity" src="/img/fr-logomark-color.svg" width="72px" />
    </div>
  {/if}

  <header id={formHeaderId}>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <T key="adminRegOtpHeader" />
    </h1>
    <Text classes="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4">
      <T key="adminRegOtpDescription" />
    </Text>
  </header>

  <div class="tw_flex tw_justify-between tw_w-full tw_gap-2 tw_my-4">
    {#each otpDigits as _digit, i}
      <input
        bind:this={otpInputs[i]}
        bind:value={otpDigits[i]}
        aria-label={`Digit ${i + 1}`}
        class="tw_w-full tw_h-16 tw_text-center tw_text-2xl tw_font-medium tw_border tw_border-secondary-dark dark:tw_border-secondary-light tw_rounded tw_bg-white dark:tw_bg-gray-800 tw_text-primary-dark dark:tw_text-primary-light focus:tw_outline-none focus:tw_ring-2 focus:tw_ring-primary"
        inputmode="numeric"
        maxlength="1"
        pattern="[0-9]"
        type="text"
        on:input={() => handleOtpInput(i)}
        on:keyup={(e) => handleOtpKeyup(e, i)}
        on:paste={handleOtpPaste}
      />
    {/each}
  </div>

  <p
    aria-live="polite"
    class="tw_text-error-dark dark:tw_text-error-light tw_text-sm tw_text-center tw_mb-4 tw_min-h-[1.25rem]"
  >
    {#if otpHasError}<T key="adminRegOtpError" />{/if}
  </p>

  <Button
    busy={journey?.loading}
    classes={otpComplete ? '' : 'tw_opacity-50 tw_pointer-events-none'}
    style="primary"
    type="button"
    width="full"
    onClick={() => submit(otpDigits.join(''))}
  >
    <T key="nextButton" />
  </Button>

  <p class="tw_my-4 tw_text-center tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light">
    <T key="adminRegOtpResendPrompt" />
    <button
      class="tw_text-link-dark dark:tw_text-link-light hover:tw_underline tw_ml-1"
      type="button"
      on:click={() => submit('resend')}
    >
      <T key="adminRegOtpResend" />
    </button>
  </p>
</Form>
