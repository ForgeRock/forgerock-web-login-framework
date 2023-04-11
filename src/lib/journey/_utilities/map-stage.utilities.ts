import Generic from '$journey/stages/generic.svelte';
import OneTimePassword from '$journey/stages/one-time-password.svelte';
import Registration from '$journey/stages/registration.svelte';
import Login from '$journey/stages/login.svelte';

import type { StepTypes } from '$journey/journey.interfaces';

/**
 * @function mapStepToStage - Maps the current step to the proper stage component.
 * @param {object} currentStep - The current step to check
 * @returns {object} - The stage Svelte component
 */
export function mapStepToStage(currentStep: StepTypes) {
  if (!currentStep || currentStep.type !== 'Step') {
    return Generic;
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
