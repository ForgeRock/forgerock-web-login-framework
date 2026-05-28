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

import AdminRegistration from '$journey/stages/admin-registration.svelte';
import EmailSuspend from '$journey/stages/email-suspend.svelte';
import Generic from '$journey/stages/generic.svelte';
import Login from '$journey/stages/login.svelte';
import MfaEnrollment from '$journey/stages/mfa-enrollment.svelte';
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
import type { Component } from 'svelte';

import type { StepTypes } from '$journey/journey.interfaces';
type StageTypes =
  | typeof AdminRegistration
  | typeof WebAuthnStage
  | typeof OneTimePassword
  | typeof Registration
  | typeof Login
  | typeof Generic
  | typeof MfaEnrollment
  | typeof QrCode
  | typeof EmailSuspend
  | typeof RecoveryCodesStage;

/**
 * @function mapStepToStage - Maps the current step to the proper stage component.
 * @param {object} currentStep - The current step to check
 * @returns {object} - The stage Svelte component
 */
export function mapStepToStage(currentStep: StepTypes): StageTypes | Component {
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
  const hasMfaHidden = hiddenValueCallbacks.some((cb) => {
    const id = cb.getOutputByName('id', '') as string;
    return id.startsWith('skip-') || id.startsWith('getapp-');
  });
  if (hasMfaHidden) return MfaEnrollment;

  // recognize app links screen based on the presence of app store URL links and message type 4 text output callback
  const textOutputCallbacks = currentStep.getCallbacksOfType(
    callbackType.TextOutputCallback,
  ) as TextOutputCallback[];
  const hasAppLinksScript = textOutputCallbacks.some(
    (cb) =>
      cb.getMessageType() === '4' &&
      (cb.getMessage().includes('itunes.apple.com') || cb.getMessage().includes('play.google.com')),
  );
  if (hasAppLinksScript) return MfaEnrollment;

  // recognize PingOne AIC admin registration screens, one unique signal per screen:
  // - invalid invite:  type-4 script message contains 'Invitation not valid'
  // - welcome:         type-4 script contains p1aic-tenant-name (tenant name span)
  // - otp (first load): HiddenValueCallback id 'p1aic-otp-answer' + type-4 script with if(false) guard on retry warning
  // - otp (retry):     HiddenValueCallback id 'p1aic-otp-answer' + type-4 script with if(true) guard on retry warning
  // - privacy policy:  HiddenValueCallback id starts with 'jurisdiction-input-'
  const isAdminRegistration =
    textOutputCallbacks.some(
      (cb) =>
        cb.getMessageType() === '4' &&
        (cb.getMessage().includes('Invitation not valid') ||
          cb.getMessage().includes('p1aic-tenant-name')),
    ) ||
    hiddenValueCallbacks.some((cb) => {
      const id = cb.getOutputByName('id', '') as string;
      return id === 'p1aic-otp-answer' || id.startsWith('jurisdiction-input-');
    });
  if (isAdminRegistration) return AdminRegistration;

  return Generic;
}
