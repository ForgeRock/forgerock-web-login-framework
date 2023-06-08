import Generic from '$journey/stages/generic.svelte';
import OneTimePassword from '$journey/stages/one-time-password.svelte';
import Registration from '$journey/stages/registration.svelte';
import Login from '$journey/stages/login.svelte';
import WebAuthn from '$journey/stages/webauthn.svelte';
import RecoveryCodes from '$journey/stages/recovery-codes.svelte';

import type { StepTypes } from '$journey/journey.interfaces';
import { FRRecoveryCodes, FRWebAuthn, WebAuthnStepType } from '@forgerock/javascript-sdk';

function isWebAuthNCheck(currentStep: StepTypes) {
  if (currentStep && 'getCallbackOfType' in currentStep) {
    const isWebAuthN =
      FRWebAuthn.getWebAuthnStepType(currentStep) || FRRecoveryCodes.isDisplayStep(currentStep);
    return isWebAuthN;
  }
  return WebAuthnStepType.None;
}
/**
 * @function mapStepToStage - Maps the current step to the proper stage component.
 * @param {object} currentStep - The current step to check
 * @returns {object} - The stage Svelte component
 */
export function mapStepToStage(currentStep: StepTypes) {
  if (currentStep === null) {
    return Generic;
  }
  const isWebAuthN = isWebAuthNCheck(currentStep);
  /**
   * because isWebAuthNCheck returns an enum, its value is 0, 1, or 2.
   * this means that 0 is falsey so we can rely on this if statement.
   * however enums are fragile so we should be careful that if we change enums this code would break.
   * if we want to be more explicit we can do this in the sdk:
   * WebAuthnStepType = "None" | "Registration" | "Authentication";
   */
  if (isWebAuthN) {
    return WebAuthn;
  }

  if (!currentStep || currentStep.type !== 'Step') {
    return Generic;
  }
  if (FRRecoveryCodes.isDisplayStep(currentStep)) {
    return RecoveryCodes;
  }
  switch (currentStep?.getStage && currentStep.getStage()) {
    case 'OneTimePassword':
      return OneTimePassword;
    case 'DefaultRegistration':
      return Registration;
    case 'DefaultLogin':
      return Login;
    default:
      return Generic;
  }
}
