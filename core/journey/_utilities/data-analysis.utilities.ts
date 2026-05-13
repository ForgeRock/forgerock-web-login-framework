/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import type {
  BaseCallback,
  ConfirmationCallback,
  SelectIdPCallback,
} from '@forgerock/journey-client/types';

import type { CallbackMetadata } from '$journey/journey.interfaces';

const selfSubmittingCallbacks = [
  callbackType.ConfirmationCallback,
  callbackType.DeviceProfileCallback,
  callbackType.PollingWaitCallback,
  callbackType.SelectIdPCallback,
  callbackType.PingOneProtectInitializeCallback,
  callbackType.PingOneProtectEvaluationCallback,
] as const;

export type SelfSubmittingCallbacks = (typeof selfSubmittingCallbacks)[number];

const userInputCallbacks = [
  callbackType.BooleanAttributeInputCallback,
  callbackType.ChoiceCallback,
  callbackType.ConfirmationCallback,
  callbackType.KbaCreateCallback,
  callbackType.NameCallback,
  callbackType.NumberAttributeInputCallback,
  callbackType.PasswordCallback,
  callbackType.ReCaptchaCallback,
  callbackType.SelectIdPCallback,
  callbackType.StringAttributeInputCallback,
  callbackType.TermsAndConditionsCallback,
  callbackType.TextInputCallback,
  callbackType.ValidatedCreatePasswordCallback,
  callbackType.ValidatedCreateUsernameCallback,
] as const;

export type UserInputCallbacks = (typeof userInputCallbacks)[number];

/**
 * @function forceUserInputOptionalityCallbacks - Determines if a callback should be forced to be optional
 */
const forceUserInputOptionalityCallbacks = {
  SelectIdPCallback: (callback: SelectIdPCallback) => {
    return !!callback
      .getProviders()
      .find((provider) => provider.provider === 'localAuthentication');
  },
};

/**
 * @function isCbReadyByDefault - Determines if a callback is ready to be submitted by default
 * @param {object} callback - Generic FRCallback from JavaScript SDK
 * @returns {boolean}
 */
export function isCbReadyByDefault(callback: BaseCallback) {
  if (callback.getType() === callbackType.ConfirmationCallback) {
    const cb = callback as ConfirmationCallback;
    if (cb.getOptions().length === 1) {
      return true;
    }
  }
  return false;
}

/**
 * @function canForceUserInputOptionality
 * @param {object} callback - generic FRCallback from JavaScript SDK
 * @returns
 */
export function canForceUserInputOptionality(callback: BaseCallback) {
  // See if a callback function exists within this collection
  const fn =
    forceUserInputOptionalityCallbacks[
      callback.getType() as keyof typeof forceUserInputOptionalityCallbacks
    ];

  // If there is a function, run it and it will return a boolean
  return fn ? fn(callback as SelectIdPCallback) : false;
}

/**
 * @function isSelfSubmitting -
 * @param {object} callback - generic FRCallback from JavaScript SDK
 * @returns
 */
export function isSelfSubmitting(callback: BaseCallback) {
  return selfSubmittingCallbacks.includes(callback.getType() as SelfSubmittingCallbacks);
}

/**
 * @function isStepSelfSubmittable -
 * @param {array} callbacks - CallbackMetadata
 * @returns
 */
export function isStepSelfSubmittable(callbacks: CallbackMetadata[], userInputOptional: boolean) {
  if (userInputOptional) {
    return true;
  }

  const unsubmittableCallbacks = callbacks.filter(
    (callback) => callback.derived.isUserInputRequired && !callback.derived.isSelfSubmitting,
  );
  return !unsubmittableCallbacks.length;
}

/**
 * @function isStepReadyToSubmit - Determines if a step is ready to be submitted
 * @param  {array} callbacks - CallbackMetadata
 * @returns {boolean}
 */
export function isStepReadyToSubmit(callbacks: CallbackMetadata[]) {
  const selfSubmittableCbs = callbacks.filter((callback) => callback.derived.isSelfSubmitting);
  const selfSubmittableCbsReadyForSubmission = callbacks.filter(
    (callback) => callback.derived.isSelfSubmitting && callback.derived.isReadyForSubmission,
  );
  // Are all self-submittable callbacks ready to be submitted
  return selfSubmittableCbsReadyForSubmission.length === selfSubmittableCbs.length;
}

/**
 * @function requiresUserInput - Determines if a callback requires user input
 * @param  {object} callback - Generic callback provided by JavaScript SDK
 * @returns {boolean}
 */
export function requiresUserInput(callback: BaseCallback) {
  if (callback.getType() === callbackType.SelectIdPCallback) {
    return false;
  }

  if (callback.getType() === callbackType.ConfirmationCallback) {
    const cb = callback as ConfirmationCallback;
    if (cb.getOptions().length === 1) {
      return false;
    }
  }
  return userInputCallbacks.includes(callback.getType() as UserInputCallbacks);
}

// Notice this function can take a user provided argument function to
// override behavior (this doesn't have to be well defined)

/**
 * @function isUserInputOptional - Determines if user input is optional
 * Notice this function can take a user provided argument function to
 * override behavior (this doesn't have to be well defined)
 * @param {array} callbackMetadataArray - array of callback metadata
 * @param  {number} numOfUserInputCbs - number of user input requiring callbacks
 * @param {function} fn - optional function to override default behavior
 * @returns {boolean} - true if user input is optional
 * @example isUserInputOptional(callbackMetadataArray, numOfUserInputCbs, (prev, curr) => {
 *   if (curr.derived.canForceUserInputOptionality && numOfUserInputCbs > 0) {
 *     prev = true;
 *   }
 *   return prev;
 * })
 * @example isUserInputOptional(callbackMetadataArray, numOfUserInputCbs);
 */
export function isUserInputOptional(
  callbackMetadataArray: CallbackMetadata[],
  numOfUserInputCbs: number,
  fn?: (prev: boolean, curr: CallbackMetadata) => boolean,
) {
  // default reducer function to check if both overriding callback exists
  // along with user input required callbacks
  const fallbackFn = (prev: boolean, curr: CallbackMetadata) => {
    if (curr.derived.canForceUserInputOptionality && numOfUserInputCbs > 0) {
      prev = true;
    }
    return prev;
  };
  // Call reduce function with either fallback or user provided function
  return callbackMetadataArray.reduce(fn || fallbackFn, false);
}
