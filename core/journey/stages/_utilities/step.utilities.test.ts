/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { describe, expect, it } from 'vitest';

import { previousRegistrationStep, restartedRegistrationStep } from './step.mock';
import {
  convertStringToKey,
  initCheckValidation,
  shouldPopulateWithPreviousCallbacks,
} from './step.utilities';

import type { JourneyClient, Step } from '@forgerock/journey-client/types';

// TODO: JourneyResult and JourneyLoginFailure are not currently exported by Journey Client, so we define them here
type JourneyResult = Awaited<ReturnType<JourneyClient['start']>>;
type JourneyLoginFailure = Extract<JourneyResult, { type: 'LoginFailure' }>;

function createLoginFailure(payload: Step): JourneyLoginFailure {
  return {
    type: 'LoginFailure' as JourneyLoginFailure['type'],
    payload,
    getCode: () => payload.code ?? 0,
    getDetail: () => undefined,
    getMessage: () => payload.message,
    getProcessedMessage: () => [],
    getReason: () => payload.reason,
  };
}

describe('Test string to key conversion', () => {
  it('should strip non-alphanumeric keys from string', () => {
    const result = convertStringToKey('Hello, World!');
    const expected = 'helloWorld';

    expect(result).toBe(expected);
  });

  it('should preserve numbers but strip out other non-alphanumeric chars', () => {
    const result = convertStringToKey('Test String: 123');
    const expected = 'testString123';

    expect(result).toBe(expected);
  });

  it('should capitalize lowercase characters for camelCase', () => {
    const result = convertStringToKey('Test string: 123');
    const expected = 'testString123';

    expect(result).toBe(expected);
  });

  it('should not crash when given an "", null or undefined', () => {
    const result0 = convertStringToKey('');
    const result1 = convertStringToKey(null);
    const result2 = convertStringToKey();
    const expected = '';

    expect(result0).toBe(expected);
    expect(result1).toBe(expected);
    expect(result2).toBe(expected);
  });
});

describe('Test check validation', () => {
  it('should return true with failed policies', () => {
    const checkValidation = initCheckValidation();
    const result = checkValidation(
      restartedRegistrationStep.getCallbackOfType(callbackType.ValidatedCreateUsernameCallback),
    );

    expect(result).toBe(true);
  });

  it('should return false with no failed policies', () => {
    const checkValidation = initCheckValidation();
    const result = checkValidation(
      restartedRegistrationStep.getCallbackOfType(callbackType.ValidatedCreatePasswordCallback),
    );

    expect(result).toBe(false);
  });
});

describe('Test step population of previous callback', () => {
  it('should return true with Constrained Violation', () => {
    const nextStep = createLoginFailure({
      message:
        'Constraint Violation: The password value for attribute userPassword was found to be unacceptable: The provided password is shorter than the minimum required length of 8 characters',
    });
    const previousStep = previousRegistrationStep;
    const restartedStep = restartedRegistrationStep;

    const result = shouldPopulateWithPreviousCallbacks(
      nextStep,
      previousStep.callbacks,
      restartedStep,
      1,
    );

    expect(result).toBeTruthy();
  });

  it('should return true with authId timeout issue', () => {
    const detailWithErrorCode = { result: false, errorCode: '110' };
    const nextStep = createLoginFailure({ detail: detailWithErrorCode });
    const previousStep = previousRegistrationStep;
    const restartedStep = restartedRegistrationStep;

    const result = shouldPopulateWithPreviousCallbacks(
      nextStep,
      previousStep.callbacks,
      restartedStep,
      1,
    );

    expect(result).toBeTruthy();
  });

  it('should return undefined if no previous callbacks', () => {
    const detailWithErrorCode = { result: false, errorCode: '110' };
    const nextStep = createLoginFailure({ detail: detailWithErrorCode });
    const restartedStep = restartedRegistrationStep;

    const result = shouldPopulateWithPreviousCallbacks(nextStep, undefined, restartedStep, 1);

    expect(result).toBeFalsy();
  });

  it('should return undefined if generic 401', () => {
    const nextStep = createLoginFailure({});
    const previousStep = previousRegistrationStep;
    const restartedStep = restartedRegistrationStep;

    const result = shouldPopulateWithPreviousCallbacks(
      nextStep,
      previousStep.callbacks,
      restartedStep,
      1,
    );

    expect(result).toBeFalsy();
  });

  it('should return undefined if return step is failure', () => {
    const detailWithErrorCode = { result: false, errorCode: '110' };
    const nextStep = createLoginFailure({ detail: detailWithErrorCode });
    const previousStep = previousRegistrationStep;
    const restartedStep = createLoginFailure({});

    const result = shouldPopulateWithPreviousCallbacks(
      nextStep,
      previousStep.callbacks,
      restartedStep,
      1,
    );

    expect(result).toBeFalsy();
  });

  it('should return false because it is neither 1 nor a Constrained Violation', () => {
    const nextStep = createLoginFailure({});
    const previousStep = previousRegistrationStep;
    const restartedStep = restartedRegistrationStep;

    const result = shouldPopulateWithPreviousCallbacks(
      nextStep,
      previousStep.callbacks,
      restartedStep,
      2,
    );

    expect(result).toBeFalsy();
  });
});
