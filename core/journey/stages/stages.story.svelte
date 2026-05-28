<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import { initialize as initializeLinks } from '$core/links.store';
  import { initialize as initializeStyles } from '$core/style.store';
  import { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';
  import { initCheckValidation } from './_utilities/step.utilities';
  import AdminRegistration from './admin-registration.svelte';
  import EmailSuspend from './email-suspend.svelte';
  import Generic from './generic.svelte';
  import Login from './login.svelte';
  import MfaEnrollment from './mfa-enrollment.svelte';
  import OneTimePassword from './one-time-password.svelte';
  import QrCode from './qr-code.svelte';
  import RecoveryCodes from './recovery-codes.svelte';
  import Registration from './registration.svelte';
  import WebAuthn from './webauthn.svelte';

  import type { JourneyStep } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { partialStyleSchema } from '$core/style.store';
  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let stage: string;
  export let step: JourneyStep;
  export let style: z.infer<typeof partialStyleSchema>;

  let stageName;
  let stageJson;

  // Mimic what happens in the `journey.store` module
  // Check if stage attribute is serialized JSON
  if (stage && stage.includes('{')) {
    try {
      stageJson = JSON.parse(stage);
    } catch (err) {
      console.warn('Stage attribute value was not parsable');
    }
  } else if (stage) {
    stageName = stage;
  }

  // Create metadata
  const callbackMetadata = buildCallbackMetadata(step, initCheckValidation(), stageJson);
  const stepMetadata = buildStepMetadata(callbackMetadata, stageJson, stageName);
  const metadata = {
    callbacks: callbackMetadata,
    step: stepMetadata,
  };

  // Initialize stores
  initializeLinks({ termsAndConditions: '/' });
  initializeStyles(style);
</script>

<Centered>
  {#if stage === 'AdminRegistration'}
    <AdminRegistration componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'EmailSuspend'}
    <EmailSuspend componentStyle="modal" {form} {journey} {metadata} {step} />
  {:else if stage === 'OneTimePassword'}
    <OneTimePassword componentStyle="modal" {form} {journey} {metadata} {step} />
  {:else if stage === 'DefaultLogin'}
    <Login componentStyle="modal" {form} {journey} {metadata} {step} />
  {:else if stage === 'DefaultRegistration'}
    <Registration componentStyle="modal" {form} {journey} {metadata} {step} />
  {:else if stage === 'RecoveryCodes'}
    <RecoveryCodes componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'WebAuthn'}
    <WebAuthn componentStyle="modal" allowWebAuthn={false} {form} {step} />
  {:else if stage === 'QRCode'}
    <QrCode componentStyle="modal" {form} {journey} {metadata} {step} />
  {:else if stage === 'MfaEnrollment'}
    <MfaEnrollment componentStyle="modal" {form} {journey} {step} />
  {:else}
    <Generic componentStyle="modal" {form} {journey} {metadata} {step} />
  {/if}
</Centered>
