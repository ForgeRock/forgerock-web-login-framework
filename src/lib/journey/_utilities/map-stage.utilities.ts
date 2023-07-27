import Generic from '$journey/stages/generic.svelte';
import OneTimePassword from '$journey/stages/one-time-password.svelte';
import Registration from '$journey/stages/registration.svelte';
import Login from '$journey/stages/login.svelte';
import WebAuthn from '$journey/stages/webauthn.svelte';
import RecoveryCodes from '$journey/stages/recovery-codes.svelte';

import type { StepTypes } from '$journey/journey.interfaces';
import { FRRecoveryCodes, FRWebAuthn  } from '@forgerock/javascript-sdk';

/**
 * @function mapStepToStage - Maps the current step to the proper stage component.
 * @param {object} currentStep - The current step to check
 * @returns {object} - The stage Svelte component
 */
export function mapStepToStage(currentStep: StepTypes) {
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

  return Generic;
}
