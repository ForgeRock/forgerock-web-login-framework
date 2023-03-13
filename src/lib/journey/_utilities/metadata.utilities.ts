import type { FRCallback, FRStep } from '@forgerock/javascript-sdk';

import type { CallbackMetadata } from '$journey/journey.interfaces';
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
 * @param checkValidation - function that checks if current callback is the first invalid callback
 * @returns {array}
 */
export function buildCallbackMetadata(
  step: FRStep,
  checkValidation: (callback: FRCallback) => boolean,
  stageJson?: Record<string, unknown> | null,
) {
  const callbackCount: Record<string, number> = {};

  return step?.callbacks.map((callback, idx) => {
    const cb = callback;
    const callbackType = cb.getType();

    let stageCbMetadata;

    if (callbackCount[callbackType]) {
      callbackCount[callbackType] = callbackCount[callbackType] + 1;
    } else {
      callbackCount[callbackType] = 1;
    }

    if (stageJson && stageJson[callbackType]) {
      const stageCbArray = stageJson[callbackType] as Record<string, string | boolean>[];
      stageCbMetadata = stageCbArray[callbackCount[callbackType] - 1];
    }

    return {
      derived: {
        canForceUserInputOptionality: canForceUserInputOptionality(callback),
        isFirstInvalidInput: checkValidation(callback),
        isReadyForSubmission: isCbReadyByDefault(callback),
        isSelfSubmitting: isSelfSubmitting(callback),
        isUserInputRequired: requiresUserInput(callback),
      },
      idx,
      // Only use the `platform` prop if there's metadata to add
      ...(stageCbMetadata && {
        platform: {
          ...stageCbMetadata,
        },
      }),
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
      isStepSelfSubmittable: isStepSelfSubmittable(callbackMetadataArray, userInputOptional),
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
