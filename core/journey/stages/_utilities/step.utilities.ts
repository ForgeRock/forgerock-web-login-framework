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
  JourneyLoginFailure,
  JourneyResult,
  JourneyStep,
} from '@forgerock/journey-client/types';

export const authIdTimeoutErrorCode = '110';
export const constrainedViolationMessage = 'constraint violation';

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

  return function checkValidation(callback: BaseCallback) {
    const failedPolices = callback.getOutputByName('failedPolicies', []);
    if (failedPolices.length && !hasPrevError) {
      hasPrevError = true;
      return true;
    }
    return false;
  };
}

/**
 * @function shouldRedirectFromStep -
 * @returns {boolean}
 */
export function shouldRedirectFromStep(step: JourneyStep) {
  return step.getCallbacksOfType(callbackType.RedirectCallback).length > 0;
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
  nextStep: JourneyLoginFailure,
  previousCallbacks: BaseCallback[] | undefined,
  restartedStep: JourneyResult | null,
  stepNumber: number,
): restartedStep is JourneyStep {
  if (!Array.isArray(previousCallbacks)) {
    return false;
  }
  if (!restartedStep || !('type' in restartedStep) || restartedStep.type !== 'Step') {
    return false;
  }

  if (stepNumber !== 1) {
    return false;
  }

  const details = (nextStep.payload?.detail ?? null) as { errorCode: string } | null;
  const message = nextStep.payload?.message?.toLowerCase() ?? null;

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
