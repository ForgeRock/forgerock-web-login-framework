import Generic from '$journey/stages/generic.svelte';
import OneTimePassword from '$journey/stages/one-time-password.svelte';
import Registration from '$journey/stages/registration.svelte';
import Login from '$journey/stages/login.svelte';
import WebAuthn from '$journey/stages/webauthn.svelte';
import RecoveryCodes from '$journey/stages/recovery-codes.svelte';
import QrCode from '$journey/stages/qr-code.svelte';
import SuspendedTextOutput from '$journey/stages/suspended-text-output.svelte';

import type { StepTypes } from '$journey/journey.interfaces';
import {
  SuspendedTextOutputCallback,
  FRRecoveryCodes,
  FRWebAuthn,
  FRQRCode,
  CallbackType,
} from '@forgerock/javascript-sdk';

type ComponentTypes =
  | typeof WebAuthn
  | typeof OneTimePassword
  | typeof Registration
  | typeof Login
  | typeof Generic
  | typeof QrCode
  | typeof SuspendedTextOutput
  | typeof RecoveryCodes;
/**
 * @function mapStepToStage - Maps the current step to the proper stage component.
 * @param {object} currentStep - The current step to check
 * @returns {object} - The stage Svelte component
 */
export function mapStepToStage(currentStep: StepTypes): ComponentTypes {
  // Handle unlikely error state
  if (!currentStep || currentStep.type !== 'Step') {
    return Generic;
  }

  // Prioritize stage value if present
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

  // getWebAuthnStepType will return 0 if not a WebAuthn step
  if (FRWebAuthn.getWebAuthnStepType(currentStep)) {
    return WebAuthn;
  }

  if (FRRecoveryCodes.isDisplayStep(currentStep)) {
    return RecoveryCodes;
  }

  if (FRQRCode.isQRCodeStep(currentStep)) {
    return QrCode;
  }

  const suspendedTextOutput: Array<SuspendedTextOutputCallback> = currentStep.getCallbacksOfType(
    CallbackType.SuspendedTextOutputCallback,
  );
  if (suspendedTextOutput.length > 0) {
    return SuspendedTextOutput;
  }

  return Generic;
}
