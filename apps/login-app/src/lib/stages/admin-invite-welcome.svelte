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

  import type { TextOutputCallback } from '@forgerock/journey-client/types';
  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  interface Props {
    componentStyle: 'app' | 'inline' | 'modal';
    form: StageFormObject;
    formEl?: HTMLFormElement | null;
    journey: StageJourneyObject;
    step: JourneyStep;
  }

  let { componentStyle, form, formEl = $bindable(), journey, step }: Props = $props();

  const formHeaderId = 'adminInviteWelcomeHeader';
  const formFailureMessageId = 'adminInviteWelcomeFailureMessage';
  const formElementId = 'adminInviteWelcomeForm';

  let msg = $derived(
    (step.getCallbacksOfType(callbackType.TextOutputCallback) as TextOutputCallback[])
      .find((cb) => cb.getMessageType() === '4')
      ?.getMessage() ?? '',
  );

  let tenantName = $derived(msg.match(/<span[^>]*p1aic-tenant-name[^>]*>([^<]+)</)?.[1] ?? '');
  let formMessageKey = $derived(convertStringToKey(form?.message));
  let formAriaDescriptor = $derived(form?.message ? formFailureMessageId : formHeaderId);
  let formNeedsFocus = $derived(!form?.message);
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
</Form>
