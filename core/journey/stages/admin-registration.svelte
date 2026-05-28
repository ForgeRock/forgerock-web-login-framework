<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

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

  type SubStage = 'welcome' | 'otpVerify' | 'privacyPolicy' | 'invalidInvite';

  const formHeaderId = 'adminRegHeader';
  const formFailureMessageId = 'adminRegFailureMessage';
  const formElementId = 'adminRegForm';

  let formMessageKey = '';
  let subStage: SubStage = 'welcome';

  let hiddenValueCb: HiddenValueCallback | null = null;
  let tenantName = '';

  // OTP state
  let otpDigits: string[] = ['', '', '', '', '', ''];
  let otpInputs: HTMLInputElement[] = [];

  // Privacy policy state
  let selectedJurisdiction = '';
  let policyChecked = false;

  let otpHasError = false;

  $: formMessageKey = convertStringToKey(form?.message);
  $: formAriaDescriptor = form?.message ? formFailureMessageId : formHeaderId;
  $: formNeedsFocus = !form?.message;

  $: {
    const hiddenCbs = step.getCallbacksOfType(
      callbackType.HiddenValueCallback,
    ) as HiddenValueCallback[];

    const jurisdictionCb = hiddenCbs.find((cb) =>
      (cb.getOutputByName('id', '') as string).startsWith('jurisdiction-input-'),
    );
    const otpCb = hiddenCbs.find(
      (cb) => (cb.getOutputByName('id', '') as string) === 'p1aic-otp-answer',
    );

    if (jurisdictionCb) {
      hiddenValueCb = jurisdictionCb;
      subStage = 'privacyPolicy';
    } else if (otpCb) {
      hiddenValueCb = otpCb;
      subStage = 'otpVerify';

      // AM toggles the retry warning via if(false)/if(true) in the script:
      // first load: if (false) { ... p1aic-otp-retry-warning ... }
      // retry:      if (true)  { ... p1aic-otp-retry-warning ... }
      const textOutputCbs = step.getCallbacksOfType(
        callbackType.TextOutputCallback,
      ) as TextOutputCallback[];
      otpHasError = textOutputCbs.some(
        (cb) =>
          cb.getMessageType() === '4' &&
          /if \(true\)\s*\{[^}]*p1aic-otp-retry-warning/.test(cb.getMessage()),
      );
      if (otpHasError) {
        otpDigits = ['', '', '', '', '', ''];
        tick().then(() => otpInputs[0]?.focus());
      }
    } else {
      hiddenValueCb = null;
      // Distinguish welcome vs invalid-invite by inspecting the script message
      const textOutputCbs = step.getCallbacksOfType(
        callbackType.TextOutputCallback,
      ) as TextOutputCallback[];
      const scriptCb = textOutputCbs.find((cb) => cb.getMessageType() === '4');
      if (scriptCb?.getMessage().includes('Invitation not valid')) {
        subStage = 'invalidInvite';
      } else {
        const msg = scriptCb?.getMessage() ?? '';
        tenantName = msg.match(/<span[^>]*p1aic-tenant-name[^>]*>([^<]+)</)?.[1] ?? '';
        subStage = 'welcome';
      }
    }
  }

  // OTP helpers
  function handleOtpKeyup(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (/^\d$/.test(event.key) && input.value.length === 1) {
      if (index < 5) otpInputs[index + 1]?.focus();
      else otpInputs[index]?.blur();
    } else if (event.key === 'Backspace' && index > 0 && input.value === '') {
      otpInputs[index - 1]?.focus();
    }
    syncOtpAnswer();
  }

  function handleOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').split('');
    otpDigits = Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
    syncOtpAnswer();
    const nextEmpty = otpDigits.findIndex((d) => d === '');
    if (nextEmpty >= 0) otpInputs[nextEmpty]?.focus();
  }

  function syncOtpAnswer() {
    hiddenValueCb?.setInputValue(otpDigits.join(''));
  }

  function submitResend() {
    hiddenValueCb?.setInputValue('resend');
    form?.submit();
  }

  const jurisdictionOptions = [
    'Australia',
    'Brazil',
    'California',
    'Canada',
    'European Union',
    'Hong Kong',
    'Indonesia',
    'New Zealand',
    'Singapore',
    'United Kingdom',
    'United States',
    'Rest of the World',
  ];

  function onJurisdictionChange(event: Event) {
    selectedJurisdiction = (event.target as HTMLSelectElement).value;
    if (selectedJurisdiction) {
      hiddenValueCb?.setInputValue(selectedJurisdiction);
    }
  }

  $: otpComplete = otpDigits.every((d) => /^\d$/.test(d));
  $: privacyPolicyReady = !!selectedJurisdiction && policyChecked;
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

  {#if subStage === 'welcome'}
    {#if componentStyle !== 'inline'}
      <header id={formHeaderId}>
        <h1 class="tw_primary-header dark:tw_primary-header_dark">
          <T key="adminRegWelcomeHeader" />
        </h1>
        <Text classes="tw_-mt-5 tw_mb-2 tw_py-4">
          <T key="adminRegWelcomeDescriptionPre" /> <strong>{tenantName}</strong>
          <T key="adminRegWelcomeDescriptionPost" />
        </Text>
        <Text classes="tw_-mt-5 tw_mb-2 tw_py-4">
          <T key="adminRegWelcomeVerification" />
        </Text>
      </header>
    {/if}

    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="adminRegSendVerificationCode" />
    </Button>
  {:else if subStage === 'otpVerify'}
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
      onClick={() => {
        syncOtpAnswer();
        form?.submit();
      }}
    >
      <T key="nextButton" />
    </Button>

    <p
      class="tw_my-4 tw_text-center tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="adminRegOtpResendPrompt" />
      <button
        class="tw_text-link-dark dark:tw_text-link-light hover:tw_underline tw_ml-1"
        type="button"
        on:click={submitResend}
      >
        <T key="adminRegOtpResend" />
      </button>
    </p>
  {:else if subStage === 'privacyPolicy'}
    <header id={formHeaderId}>
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="adminRegPrivacyPolicyHeader" />
      </h1>
      <Text classes="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4">
        <T key="adminRegPrivacyPolicyDescription" />
      </Text>
    </header>

    <div class="tw_mb-4">
      <select
        aria-label={interpolate('adminRegPrivacyPolicySelectRegion')}
        class="tw_w-full tw_border tw_border-secondary-dark dark:tw_border-secondary-light tw_rounded tw_p-2 tw_bg-white dark:tw_bg-gray-800 tw_text-primary-dark dark:tw_text-primary-light"
        value={selectedJurisdiction}
        on:change={onJurisdictionChange}
      >
        <option value=""><T key="adminRegPrivacyPolicySelectRegion" /></option>
        {#each jurisdictionOptions as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </div>

    <div
      class="tw_flex tw_items-start tw_gap-2 tw_mb-4 tw_p-4 {selectedJurisdiction
        ? ''
        : 'tw_invisible'}"
    >
      <input
        bind:checked={policyChecked}
        class="tw_mt-1"
        id="privacyPolicyCheck"
        tabindex={selectedJurisdiction ? 0 : -1}
        type="checkbox"
      />
      <label
        class="tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light"
        for="privacyPolicyCheck"
      >
        <T html={true} key="adminRegPrivacyPolicyAgreement" />
      </label>
    </div>

    <Button
      busy={journey?.loading}
      classes={privacyPolicyReady ? '' : 'tw_opacity-50 tw_pointer-events-none'}
      style="primary"
      type="button"
      width="full"
      onClick={() => form?.submit()}
    >
      <T key="continueButton" />
    </Button>
  {:else}
    <!-- invalidInvite -->
    <header id={formHeaderId}>
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="adminRegInvalidInviteHeader" />
      </h1>
      <Text classes="tw_text-center tw_-mt-5 tw_mb-4 tw_py-4">
        <T html={true} key="adminRegInvalidInviteDescription" />
      </Text>
    </header>
  {/if}
</Form>
