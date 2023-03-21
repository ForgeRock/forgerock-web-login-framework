import Generic from '$journey/stages/generic.svelte';
import OneTimePassword from '$journey/stages/one-time-password.svelte';
import Registration from '$journey/stages/registration.svelte';
import Login from '$journey/stages/login.svelte';

import type { StepTypes } from '$journey/journey.interfaces';

export function mapStepToStage(currentStep: StepTypes) {
  /** *********************************************************************
   * SDK INTEGRATION POINT
   * Summary:SDK step method for getting the stage value
   * ----------------------------------------------------------------------
   * Details: This method is helpful in quickly identifying the stage
   * when you want to provide special layout or handling of the form
   ********************************************************************* */
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
