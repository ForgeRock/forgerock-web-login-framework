<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { callbackType } from '@forgerock/journey-client';

  import T from '$components/_utilities/locale-strings.svelte';
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

  import type { HiddenValueCallback, JourneyStep } from '@forgerock/journey-client/types';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  interface Props {
    componentStyle: 'app' | 'inline' | 'modal';
    form: StageFormObject;
    formEl?: HTMLFormElement | null;
    journey: StageJourneyObject;
    step: JourneyStep;
  }

  let { componentStyle, form, formEl = $bindable(null), journey, step }: Props = $props();

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

  const formFailureMessageId = 'adminInvitePrivacyPolicyFailureMessage';
  const formHeaderId = 'adminInvitePrivacyPolicyHeader';
  const formElementId = 'adminInvitePrivacyPolicyForm';

  let formMessageKey = $derived(convertStringToKey(form?.message));
  let formAriaDescriptor = $derived(form?.message ? formFailureMessageId : formHeaderId);
  let formNeedsFocus = $derived(!form?.message);

  const hiddenValueCb =
    (step.getCallbacksOfType(callbackType.HiddenValueCallback) as HiddenValueCallback[]).find(
      (cb) => (cb.getOutputByName('id', '') as string).startsWith('jurisdiction-input-'),
    ) ?? null;

  let selectedJurisdiction = $state('');
  let policyChecked = $state(false);

  let ready = $derived(!!selectedJurisdiction && policyChecked);
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
      <T key="adminRegPrivacyPolicyHeader" />
    </h1>
    <Text classes="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4">
      <T key="adminRegPrivacyPolicyDescription" />
    </Text>
  </header>

  <div class="tw_mb-4">
    <select
      aria-label={interpolate('adminRegPrivacyPolicySelectRegion')}
      bind:value={selectedJurisdiction}
      class="tw_w-full tw_border tw_border-secondary-dark dark:tw_border-secondary-light tw_rounded tw_p-2 tw_bg-white dark:tw_bg-gray-800 tw_text-primary-dark dark:tw_text-primary-light"
      onchange={() => hiddenValueCb?.setInputValue(selectedJurisdiction)}
    >
      <option value=""><T key="adminRegPrivacyPolicySelectRegion" /></option>
      {#each jurisdictionOptions as opt}
        <option value={opt}>{opt}</option>
      {/each}
    </select>
  </div>

  <div
    class="tw_flex tw_items-start tw_gap-2 tw_mb-4 tw_p-4"
    class:tw_invisible={!selectedJurisdiction}
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
    classes={ready ? '' : 'tw_opacity-50 tw_pointer-events-none'}
    style="primary"
    type="button"
    width="full"
    onClick={() => form?.submit()}
  >
    <T key="continueButton" />
  </Button>
</Form>
