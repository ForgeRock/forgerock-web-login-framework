<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { callbackType } from '@forgerock/journey-client';

  import Alert from '$components/primitives/alert/alert.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';
  import InvalidInvite from './invalid-invite.svelte';
  import Otp from './otp.svelte';
  import PrivacyPolicy from './privacy-policy.svelte';
  import Welcome from './welcome.svelte';

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

  let subStage: SubStage = 'welcome';
  let tenantName = '';

  function pickSubStage(currentStep: JourneyStep): { subStage: SubStage; tenantName: string } {
    const hiddenCbs = currentStep.getCallbacksOfType(
      callbackType.HiddenValueCallback,
    ) as HiddenValueCallback[];
    const msg =
      (currentStep.getCallbacksOfType(callbackType.TextOutputCallback) as TextOutputCallback[])
        .find((cb) => cb.getMessageType() === '4')
        ?.getMessage() ?? '';

    const jurisdictionCb = hiddenCbs.find((cb) =>
      (cb.getOutputByName('id', '') as string).startsWith('jurisdiction-input-'),
    );
    const otpCb = jurisdictionCb
      ? null
      : hiddenCbs.find((cb) => (cb.getOutputByName('id', '') as string) === 'p1aic-otp-answer');

    const subStageRules: { subStage: SubStage; match: boolean }[] = [
      { subStage: 'privacyPolicy', match: !!jurisdictionCb },
      { subStage: 'otpVerify', match: !!otpCb },
      { subStage: 'invalidInvite', match: msg.includes('Invitation not valid') },
    ];

    const resolved = subStageRules.find((rule) => rule.match)?.subStage ?? 'welcome';
    return {
      subStage: resolved,
      tenantName:
        resolved === 'welcome'
          ? msg.match(/<span[^>]*p1aic-tenant-name[^>]*>([^<]+)</)?.[1] ?? ''
          : '',
    };
  }

  $: ({ subStage, tenantName } = pickSubStage(step));
  $: formMessageKey = convertStringToKey(form?.message);
  $: formAriaDescriptor = form?.message ? formFailureMessageId : formHeaderId;
  $: formNeedsFocus = !form?.message;
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
    <Welcome {componentStyle} headerId={formHeaderId} {journey} {tenantName} />
  {:else if subStage === 'otpVerify'}
    <Otp {form} headerId={formHeaderId} {journey} {step} />
  {:else if subStage === 'privacyPolicy'}
    <PrivacyPolicy {form} headerId={formHeaderId} {journey} {step} />
  {:else}
    <InvalidInvite headerId={formHeaderId} />
  {/if}
</Form>
