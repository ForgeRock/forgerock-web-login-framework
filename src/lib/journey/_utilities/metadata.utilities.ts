import type { FRCallback } from '@forgerock/javascript-sdk';

import type { CallbackMetadata, WidgetStep } from '$journey/journey.interfaces';
import {
  canForceUserInputOptionality,
  isCbReadyByDefault,
  isSelfSubmitting,
  isStepSelfSubmittable,
  isUserInputOptional,
  requiresUserInput,
} from './data-analysis.utilities';

/**
 * @function buildCallbackMetadata - Constructs an array of callback metadata that matches to original callback array
 * @param {object} step - The modified Widget step object
 * @param checkValidation
 * @returns {array}
 */
export function buildCallbackMetadata(
  step: WidgetStep,
  checkValidation: (callback: FRCallback) => boolean,
) {
  const callbackCount: Record<string, number> = {};

  return step?.callbacks.map((callback, idx) => {
    const cb = callback as FRCallback;
    const callbackType = cb.getType();

    if (callbackCount[callbackType]) {
      callbackCount[callbackType] = callbackCount[callbackType] + 1;
    } else {
      callbackCount[callbackType] = 1;
    }

    return {
      canForceUserInputOptionality: canForceUserInputOptionality(callback),
      isFirstInvalidInput: checkValidation(callback),
      isReadyForSubmission: isCbReadyByDefault(callback),
      isSelfSubmitting: isSelfSubmitting(callback),
      isUserInputRequired: requiresUserInput(callback),
      idx,
    };
  });
}

/**
 * @function buildStepMetadata - Constructs a metadata object that summarizes the step from AM
 * @param {array} callbackMetadataArray - The array returned from buildCallbackMetadata
 * @returns {object}
 */
export function buildStepMetadata(callbackMetadataArray: CallbackMetadata[]) {
  const numOfUserInputCbs = callbackMetadataArray.filter((cb) => !!cb.isUserInputRequired).length;
  const userInputOptional = isUserInputOptional(callbackMetadataArray, numOfUserInputCbs);

  return {
    isStepSelfSubmittable: isStepSelfSubmittable(callbackMetadataArray, userInputOptional),
    isUserInputOptional: userInputOptional,
    numOfCallbacks: callbackMetadataArray.length,
    numOfSelfSubmittableCbs: callbackMetadataArray.filter((cb) => !!cb.isSelfSubmitting).length,
    numOfUserInputCbs: numOfUserInputCbs,
  };
}
