/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { QRCode } from '@forgerock/journey-client/qr-code';
import { RecoveryCodes } from '@forgerock/journey-client/recovery-codes';
import { WebAuthn } from '@forgerock/journey-client/webauthn';

import EmailSuspend from '$journey/stages/email-suspend.svelte';
import Generic from '$journey/stages/generic.svelte';
import Login from '$journey/stages/login.svelte';
import OneTimePassword from '$journey/stages/one-time-password.svelte';
import QrCode from '$journey/stages/qr-code.svelte';
import RecoveryCodesStage from '$journey/stages/recovery-codes.svelte';
import Registration from '$journey/stages/registration.svelte';
import WebAuthnStage from '$journey/stages/webauthn.svelte';
import { isMixedLoginWebAuthnStep } from '../stages/_utilities/webauthn.utilities';
import { customStageRegistry } from './registry/custom-registry';

import type {
  HiddenValueCallback,
  SuspendedTextOutputCallback,
  TextOutputCallback,
} from '@forgerock/journey-client/types';

import type { StageComponent, StepTypes } from '$journey/journey.interfaces';

/**
 * @function mapStepToStage - Maps the current step to the proper stage component.
 * @param {object} currentStep - The current step to check
 * @param {object} stages - Optional map of app-owned stage names to components
 * @returns {StageComponent} - The resolved Svelte stage component
 */
export function mapStepToStage(
  currentStep: StepTypes,
  stages: Record<string, StageComponent> = {},
): StageComponent {
  // Handle unlikely error state
  if (!currentStep || currentStep.type !== 'Step') {
    return Generic;
  }

  const stageName = currentStep?.getStage?.()?.trim();

  // Check custom registry first — handles both overrides of known stages
  // (e.g. DefaultLogin) and brand-new stage names for custom AM nodes.
  if (stageName && customStageRegistry[stageName]) {
    return customStageRegistry[stageName].component;
  }

  // Prioritize stage value if present for known defaults
  switch (currentStep?.getStage && currentStep.getStage()) {
    case 'OneTimePassword':
      return OneTimePassword;
    case 'DefaultRegistration':
      return Registration;
    case 'DefaultLogin':
      return Login;
    default:
      // Don't return function but continue on
      break;
  }

  // Mixed login + WebAuthn steps should render a callback-form stage so the
  // username field exists for passkey autofill. This avoids mapping these steps
  // to the pure WebAuthn stage when the AM `stage` value is missing.
  if (isMixedLoginWebAuthnStep(currentStep)) {
    return Login;
  }

  // getWebAuthnStepType will return 0 if not a WebAuthn step
  if (WebAuthn.getWebAuthnStepType(currentStep)) {
    return WebAuthnStage;
  }

  if (RecoveryCodes.isDisplayStep(currentStep)) {
    return RecoveryCodesStage;
  }

  if (QRCode.isQRCodeStep(currentStep)) {
    return QrCode;
  }

  const suspendedTextOutput: Array<SuspendedTextOutputCallback> = currentStep.getCallbacksOfType(
    callbackType.SuspendedTextOutputCallback,
  );
  if (suspendedTextOutput.length > 0) {
    return EmailSuspend;
  }

  const hiddenValueCallbacks = currentStep.getCallbacksOfType(
    callbackType.HiddenValueCallback,
  ) as HiddenValueCallback[];
  const textOutputCallbacks = currentStep.getCallbacksOfType(
    callbackType.TextOutputCallback,
  ) as TextOutputCallback[];

  if (
    hiddenValueCallbacks.some((cb) =>
      (cb.getOutputByName('id', '') as string).startsWith('jurisdiction-input-'),
    )
  ) {
    return stages['AdminInvitePrivacyPolicy'] ?? Generic;
  }

  if (
    hiddenValueCallbacks.some(
      (cb) => (cb.getOutputByName('id', '') as string) === 'p1aic-otp-answer',
    )
  ) {
    return stages['AdminInviteVerifyCode'] ?? Generic;
  }

  if (
    hiddenValueCallbacks.some((cb) =>
      (cb.getOutputByName('id', '') as string).startsWith('getapp-'),
    )
  ) {
    return stages['MfaDownloadApp'] ?? Generic;
  }

  if (
    hiddenValueCallbacks.some((cb) => (cb.getOutputByName('id', '') as string).startsWith('skip-'))
  ) {
    return stages['MfaSetupPrompt'] ?? Generic;
  }

  const type4Messages = textOutputCallbacks
    .filter((cb) => cb.getMessageType() === '4')
    .map((cb) => cb.getMessage());

  if (type4Messages.some((msg) => msg.includes('Invitation not valid'))) {
    return stages['AdminInviteInvalid'] ?? Generic;
  }

  if (type4Messages.some((msg) => msg.includes('p1aic-tenant-name'))) {
    return stages['AdminInviteWelcome'] ?? Generic;
  }

  if (
    type4Messages.some((msg) => msg.includes('itunes.apple.com') || msg.includes('play.google.com'))
  ) {
    return stages['MfaAppStoreLinks'] ?? Generic;
  }

  return Generic;
}
