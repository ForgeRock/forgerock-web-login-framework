<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import AdminInviteInvalid from './admin-invite-invalid.svelte';
  import AdminInvitePrivacyPolicy from './admin-invite-privacy-policy.svelte';
  import AdminInviteVerifyCode from './admin-invite-verify-code.svelte';
  import AdminInviteWelcome from './admin-invite-welcome.svelte';
  import MfaAppStoreLinks from './mfa-app-store-links.svelte';
  import MfaDownloadApp from './mfa-download-app.svelte';
  import MfaSetupPrompt from './mfa-setup-prompt.svelte';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  interface Props {
    form: StageFormObject;
    journey: StageJourneyObject;
    stage: string;
    step: JourneyStep;
  }

  let {
    form,
    journey,
    stage,
    step
  }: Props = $props();
</script>

<Centered>
  {#if stage === 'AdminInviteWelcome'}
    <AdminInviteWelcome componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'AdminInviteVerifyCode'}
    <AdminInviteVerifyCode componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'AdminInvitePrivacyPolicy'}
    <AdminInvitePrivacyPolicy componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'AdminInviteInvalid'}
    <AdminInviteInvalid componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'MfaSetupPrompt'}
    <MfaSetupPrompt componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'MfaDownloadApp'}
    <MfaDownloadApp componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'MfaAppStoreLinks'}
    <MfaAppStoreLinks componentStyle="modal" {form} {journey} {step} />
  {/if}
</Centered>
