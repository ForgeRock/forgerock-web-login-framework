import {
  FRCallback,
  FRStep,
  FRLoginFailure,
  FRLoginSuccess,
  StepType,
  CallbackType,
  ConfirmationCallback,
} from '@forgerock/javascript-sdk';

import type { CallbackMetadata } from '$journey/journey.interfaces';

export const authIdTimeoutErrorCode = '110';
export const constrainedViolationMessage = 'constraint violation';

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
 * @function convertStringToKey -
 * @param {string} string
 * @returns {string}
 */
export function convertStringToKey(string?: string | null): string {
  if (!string) {
    return '';
  }

  if (string.toLocaleLowerCase().includes('constraint violation')) {
    console.error(
      'Delta Sierra error has occurred. Please communicate this to your system administrator.',
    );
    if (string.toLocaleLowerCase().includes('password')) {
      return 'constraintViolationForPassword';
    }
    return 'constraintViolationForValue';
  }

  const replaceFunction = (_: string, char: string): string => `${char.toLowerCase()}`;

  const normalizedString = string
    .replace(/^([A-Z])/g, replaceFunction)
    .replace(/\s([a-z])/g, (_, char) => `${char.toUpperCase()}`);
  const key = normalizedString.replace(/\W/g, '');
  return key;
}

/**
 * @function initCheckValidation -
 * @returns {boolean}
 */
export function initCheckValidation() {
  let hasPrevError = false;

  return function checkValidation(callback: FRCallback) {
    const failedPolices = callback.getOutputByName('failedPolicies', []);
    if (failedPolices.length && !hasPrevError) {
      hasPrevError = true;
      return true;
    }
    return false;
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
 * @function isSelfSubmittingCb -
 * @param {object} callback - generic FRCallback from JavaScript SDK
 * @returns
 */
export function isSelfSubmittingCb(callback: FRCallback) {
  return selfSubmittingCallbacks.includes(callback.getType());
}

/**
 * @function isStepSelfSubmittable -
 * @param {array} callbacks - CallbackMetadata
 * @returns
 */
export function isStepSelfSubmittable(callbacks: CallbackMetadata[]) {
  const unsubmittableCallbacks = callbacks.filter(
    (callback) => callback.isUserInputRequired && !callback.isSelfSubmittingCb,
  );
  return !unsubmittableCallbacks.length;
}

/**
 * @function isStepReadyToSubmit -
 * @param  {array} callbacks - CallbackMetadata
 * @returns
 */
export function isStepReadyToSubmit(callbacks: CallbackMetadata[]) {
  const selfSubmittableCbs = callbacks.filter((callback) => callback.isSelfSubmittingCb);
  const selfSubmittableCbsReadyForSubmission = callbacks.filter(
    (callback) => callback.isSelfSubmittingCb && callback.isReadyForSubmission,
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

/**
 * @function shouldPopulateWithPreviousCallbacks -
 * @param {object} nextStep
 * @param {array} previousCallbacks
 * @param {object} restartedStep
 * @param {number} stepNumber
 * @returns {boolean}
 */
export function shouldPopulateWithPreviousCallbacks(
  nextStep: FRLoginFailure,
  previousCallbacks: FRCallback[] | undefined,
  restartedStep: FRStep | FRLoginSuccess | FRLoginFailure,
  stepNumber: number,
) {
  if (!Array.isArray(previousCallbacks)) {
    return false;
  }
  if (restartedStep.type !== StepType.Step) {
    return false;
  }

  if (stepNumber !== 1) {
    return false;
  }

  const details = nextStep.payload.detail as { errorCode: string } | null;
  const message = nextStep.payload.message?.toLowerCase() as string | null;

  /**
   * Now that we know we have previous callbacks, this is of type "Step",
   * it has payload detail or payload message, and it's just the first step,
   * we can populate the new step with old callbacks.
   */
  if (
    details?.errorCode === authIdTimeoutErrorCode ||
    message?.includes(constrainedViolationMessage)
  ) {
    return true;
  }

  // Fallback to false
  return false;
}
