import {
  isCbReadyByDefault,
  isSelfSubmittingCb,
  isStepSelfSubmittable,
  requiresUserInput,
} from '$journey/_utilities/step.utilities';

import type { FRCallback } from '@forgerock/javascript-sdk';
import type { CallbackMetadata, WidgetStep } from '$journey/journey.interfaces';

export function buildStepMetadata(callbackMetadataArray: CallbackMetadata[]) {
  return {
    isStepSelfSubmittable: isStepSelfSubmittable(callbackMetadataArray),
    numOfCallbacks: callbackMetadataArray.length,
    numOfSelfSubmittableCbs: callbackMetadataArray.filter((cb) => !!cb.isSelfSubmittingCb).length,
    numOfUserInputCbs: callbackMetadataArray.filter((cb) => !!cb.isUserInputRequired).length,
  }
}
export function buildCallbackMetadata(
  step: WidgetStep,
  checkValidation: (callback: FRCallback) => boolean,
) {
  return step?.callbacks.map((callback, idx) => {
    return {
      isFirstInvalidInput: checkValidation(callback),
      isReadyForSubmission: isCbReadyByDefault(callback),
      isSelfSubmittingCb: isSelfSubmittingCb(callback),
      isUserInputRequired: requiresUserInput(callback),
      idx,
    };
  });
}
