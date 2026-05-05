/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { isMixedLoginWebAuthnStep } from '../stages/_utilities/webauthn.utilities';
import {
  canForceUserInputOptionality,
  isCbReadyByDefault,
  isSelfSubmitting,
  isStepSelfSubmittable,
  isUserInputOptional,
  requiresUserInput,
} from './data-analysis.utilities';

import type { BaseCallback, JourneyStep } from '@forgerock/journey-client/types';

import type { CallbackMetadata } from '$journey/journey.interfaces';

const captchaCallbackTypes = new Set(['ReCaptchaCallback', 'ReCaptchaEnterpriseCallback']);

/**
 * @function buildCallbackMetadata - Constructs an array of callback metadata that matches to original callback array
 * @param {object} step - The modified Widget step object
 * @param {function} checkValidation - function that checks if current callback is the first invalid callback
 * @param {object} stageJson - Optional stage JSON from AM
 * @param {object} initializationOptions - Optional widget-level initialization options (e.g. captcha config)
 * @returns {array}
 */
export function buildCallbackMetadata(
  step: JourneyStep,
  checkValidation: (callback: BaseCallback) => boolean,
  stageJson?: Record<string, unknown> | null,
  initializationOptions?: Record<string, unknown> | null,
) {
  const callbackCount: Record<string, number> = {};
  const isPasskeyAutofillEligible = isMixedLoginWebAuthnStep(step);

  return step?.callbacks.map((callback, idx) => {
    const callbackType = callback.getType();

    let stageCbMetadata;
    let initOptions;

    if (callbackCount[callbackType]) {
      callbackCount[callbackType] = callbackCount[callbackType] + 1;
    } else {
      callbackCount[callbackType] = 1;
    }

    if (stageJson && stageJson[callbackType]) {
      const stageCbArray = stageJson[callbackType] as Record<string, string | boolean>[];
      stageCbMetadata = stageCbArray[callbackCount[callbackType] - 1];
    }

    if (captchaCallbackTypes.has(callbackType)) {
      const captchaConfig = initializationOptions?.captcha as Record<string, unknown> | undefined;
      const recaptchaAction = initializationOptions?.recaptchaAction as string | null | undefined;
      if (captchaConfig || recaptchaAction) {
        initOptions = { ...captchaConfig, ...(recaptchaAction && { recaptchaAction }) };
      }
    }

    return {
      derived: {
        canForceUserInputOptionality: canForceUserInputOptionality(callback),
        isFirstInvalidInput: checkValidation(callback),
        isReadyForSubmission: isCbReadyByDefault(callback),
        isSelfSubmitting: isSelfSubmitting(callback),
        isUserInputRequired: requiresUserInput(callback),
        isPasskeyAutofillEligible,
      },
      idx,
      // Only use the `platform` prop if there's metadata to add
      ...(stageCbMetadata && {
        platform: {
          ...stageCbMetadata,
        },
      }),
      ...(initOptions && { initOptions }),
    };
  });
}

/**
 * @function buildStepMetadata - Constructs a metadata object that summarizes the step from AM
 * @param {array} callbackMetadataArray - The array returned from buildCallbackMetadata
 * @returns {object}
 */
export function buildStepMetadata<T = unknown>(
  callbackMetadataArray: CallbackMetadata[],
  stageJson?: Record<string, T> | null,
  stageName?: string | null,
) {
  const numOfUserInputCbs = callbackMetadataArray.filter(
    (cb) => !!cb.derived.isUserInputRequired,
  ).length;
  const userInputOptional = isUserInputOptional(callbackMetadataArray, numOfUserInputCbs);

  let stageMetadata;

  if (stageJson) {
    stageMetadata = Object.keys(stageJson).reduce<Record<string, T>>((prev, curr) => {
      // Filter out objects or arrays as those are for the callbacks
      if (typeof stageJson[curr] !== 'object') {
        prev[curr] = stageJson[curr];
      }
      return prev;
    }, {});
  }

  return {
    derived: {
      isStepSelfSubmittable: () => isStepSelfSubmittable(callbackMetadataArray, userInputOptional),
      isUserInputOptional: userInputOptional,
      numOfCallbacks: callbackMetadataArray.length,
      numOfSelfSubmittableCbs: callbackMetadataArray.filter((cb) => !!cb.derived.isSelfSubmitting)
        .length,
      numOfUserInputCbs: numOfUserInputCbs,
    },
    // Only use the `platform` prop if there's metadata to add
    ...(stageMetadata && {
      platform: {
        ...stageMetadata,
      },
    }),
    // stageName and stateMetadata are mutually exclusive
    ...(stageName && {
      platform: {
        stageName,
      },
    }),
  };
}
