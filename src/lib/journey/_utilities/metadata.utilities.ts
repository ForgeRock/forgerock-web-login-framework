import { CallbackType, ConfirmationCallback, type FRCallback } from '@forgerock/javascript-sdk';

import type { CallbackMetadata, WidgetStep } from '$journey/journey.interfaces';

const selfSubmittingCallbacks: string[] = [
  CallbackType.ConfirmationCallback,
  CallbackType.DeviceProfileCallback,
  CallbackType.PollingWaitCallback,
];
const userInputCallbacks: string[] = [
  CallbackType.BooleanAttributeInputCallback,
  CallbackType.ChoiceCallback,
  CallbackType.ConfirmationCallback,
  CallbackType.KbaCreateCallback,
  CallbackType.NameCallback,
  CallbackType.NumberAttributeInputCallback,
  CallbackType.PasswordCallback,
  CallbackType.ReCaptchaCallback,
  CallbackType.SelectIdPCallback,
  CallbackType.StringAttributeInputCallback,
  CallbackType.TermsAndConditionsCallback,
  CallbackType.ValidatedCreatePasswordCallback,
  CallbackType.ValidatedCreateUsernameCallback,
];

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
  return step?.callbacks.map((callback, idx) => {
    return {
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
  return {
    isStepSelfSubmittable: isStepSelfSubmittable(callbackMetadataArray),
    numOfCallbacks: callbackMetadataArray.length,
    numOfSelfSubmittableCbs: callbackMetadataArray.filter((cb) => !!cb.isSelfSubmitting).length,
    numOfUserInputCbs: callbackMetadataArray.filter((cb) => !!cb.isUserInputRequired).length,
  };
}

export function isCbReadyByDefault(callback: FRCallback) {
  if (callback.getType() === CallbackType.ConfirmationCallback) {
    const cb = callback as ConfirmationCallback;
    if (cb.getOptions().length === 1) {
      return true;
    }
  }
  return false;
}

/**
 * @function isSelfSubmitting -
 * @param {object} callback - generic FRCallback from JavaScript SDK
 * @returns
 */
export function isSelfSubmitting(callback: FRCallback) {
  return selfSubmittingCallbacks.includes(callback.getType());
}

/**
 * @function isStepSelfSubmittable -
 * @param {array} callbacks - CallbackMetadata
 * @returns
 */
export function isStepSelfSubmittable(callbacks: CallbackMetadata[]) {
  const unsubmittableCallbacks = callbacks.filter(
    (callback) => callback.isUserInputRequired && !callback.isSelfSubmitting,
  );
  return !unsubmittableCallbacks.length;
}

/**
 * @function isStepReadyToSubmit -
 * @param  {array} callbacks - CallbackMetadata
 * @returns
 */
export function isStepReadyToSubmit(callbacks: CallbackMetadata[]) {
  const selfSubmittableCbs = callbacks.filter((callback) => callback.isSelfSubmitting);
  const selfSubmittableCbsReadyForSubmission = callbacks.filter(
    (callback) => callback.isSelfSubmitting && callback.isReadyForSubmission,
  );
  // Are all self-submittable callbacks ready to be submitted
  return selfSubmittableCbsReadyForSubmission.length === selfSubmittableCbs.length;
}

/**
 *
 * @param  {object} callback - Generic callback provided by JavaScript SDK
 * @returns
 */
export function requiresUserInput(callback: FRCallback) {
  if (callback.getType() === CallbackType.ConfirmationCallback) {
    const cb = callback as ConfirmationCallback;
    if (cb.getOptions().length === 1) {
      return false;
    }
  }
  return userInputCallbacks.includes(callback.getType());
}
