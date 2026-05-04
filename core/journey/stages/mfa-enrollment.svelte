<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { callbackType } from '@forgerock/journey-client';
  import { afterUpdate } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import ShieldIcon from '$components/icons/shield-icon.svelte';
  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Text from '$components/primitives/text/text.svelte';
  // i18n
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

  import type {
    ConfirmationCallback,
    HiddenValueCallback,
    JourneyStep,
  } from '@forgerock/journey-client/types';

  // Types
  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let step: JourneyStep;

  type SubStage = 'enrollment' | 'getApp' | 'appLinks';

  const formFailureMessageId = 'mfaEnrollmentFailureMessage';
  const formHeaderId = 'mfaEnrollmentHeader';
  const formElementId = 'mfaEnrollmentForm';

  let alertNeedsFocus = false;
  let formMessageKey = '';
  let formAriaDescriptor = formHeaderId;
  let formNeedsFocus = false;
  let subStage: SubStage = 'enrollment';
  let confirmationCb: ConfirmationCallback | null = null;
  let hiddenValueCb: HiddenValueCallback | null = null;

  afterUpdate(() => {
    if (form?.message) {
      formAriaDescriptor = formFailureMessageId;
      alertNeedsFocus = true;
      formNeedsFocus = false;
    } else {
      formAriaDescriptor = formHeaderId;
      alertNeedsFocus = false;
      formNeedsFocus = true;
    }
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);

    const confirmationCbs = step.getCallbacksOfType(
      callbackType.ConfirmationCallback,
    ) as ConfirmationCallback[];
    confirmationCb = confirmationCbs[0] ?? null;

    const hiddenCbs = step.getCallbacksOfType(
      callbackType.HiddenValueCallback,
    ) as HiddenValueCallback[];
    hiddenValueCb = hiddenCbs[0] ?? null;

    const hiddenId = (hiddenValueCb?.getOutputByName('id', '') as string) ?? '';

    if (hiddenId.startsWith('getapp-')) {
      subStage = 'getApp';
    } else if (hiddenId.startsWith('skip-')) {
      subStage = 'enrollment';
    } else {
      subStage = 'appLinks';
    }
  }

  function submitWithValue(value: string) {
    confirmationCb?.setInputValue(value);
    form?.submit();
  }

  function submitHidden(value: string) {
    hiddenValueCb?.setInputValue(value);
    form?.submit();
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy={formAriaDescriptor}
  id={formElementId}
  needsFocus={formNeedsFocus}
  onSubmitWhenValid={() => form?.submit()}
>
  {#if form?.icon && componentStyle !== 'inline'}
    <div class="tw_flex tw_justify-center">
      <ShieldIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}

  {#if form?.message}
    <Alert id={formFailureMessageId} needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#if subStage === 'enrollment'}
    <header id={formHeaderId}>
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="setupTwoStepVerification" />
      </h1>
      <Text classes="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4">
        <T key="setupTwoStepVerificationDescription" />
      </Text>
    </header>

    <Alert id="mfaWarning" needsFocus={false} type="warning">
      <T html={true} key="setupTwoStepVerificationWarning" />
    </Alert>

    <Button
      busy={journey?.loading}
      style="primary"
      type="button"
      width="full"
      onClick={() => submitWithValue('0')}
    >
      <T key="setupTwoStepVerificationButton" />
    </Button>

    <p class="tw_my-4 tw_text-center tw_text-sm">
      <button
        class="tw_text-link-dark dark:tw_text-link-light tw_underline"
        type="button"
        on:click={() => submitHidden('Skip')}
      >
        <T key="skipForNow" />
      </button>
    </p>
  {:else if subStage === 'getApp'}
    <header id={formHeaderId}>
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="getAuthenticatorApp" />
      </h1>
      <Text classes="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4">
        <T key="getAuthenticatorAppDescription" />
      </Text>
    </header>

    <Button
      busy={journey?.loading}
      style="primary"
      type="button"
      width="full"
      onClick={() => submitWithValue('0')}
    >
      <T key="next" />
    </Button>

    <p class="tw_my-4 tw_text-center tw_text-sm">
      <button
        class="tw_text-link-dark dark:tw_text-link-light tw_underline"
        type="button"
        on:click={() => submitHidden('Get app')}
      >
        <T key="downloadTheApp" />
      </button>
    </p>
  {:else}
    <header id={formHeaderId}>
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="getAuthenticatorApp" />
      </h1>
      <Text classes="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4">
        <T html={true} key="getAuthenticatorAppLinks" />
      </Text>
    </header>

    <Button
      busy={journey?.loading}
      style="primary"
      type="button"
      width="full"
      onClick={() => submitWithValue('0')}
    >
      <T key="continueButton" />
    </Button>
  {/if}
</Form>
