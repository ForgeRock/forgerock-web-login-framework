import { FRLoginFailure } from '@forgerock/javascript-sdk';
import { describe, expect, it } from 'vitest';

import { previousRegistrationStep, restartedRegistrationStep } from './step.mock';
import { convertStringToKey, isStepReadyToSubmit, shouldPopulateWithPreviousCallbacks } from './step.utilities';

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

describe('Test step population of previous callback', () => {
  it('should return true with Constrained Violation', () => {
    const nextStep = new FRLoginFailure({
      code: 401,
      message:
        'Constraint Violation: The password value for attribute userPassword was found to be unacceptable: The provided password is shorter than the minimum required length of 8 characters',
      reason: 'Unauthorized',
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
    const nextStep = new FRLoginFailure({
      code: 401,
      detail: {
        // eslint-disable-next-line
        // @ts-ignore
        errorCode: '110',
      },
      reason: 'Unauthorized',
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

  it('should return undefined if no previous callbacks', () => {
    const nextStep = new FRLoginFailure({
      code: 401,
      detail: {
        // eslint-disable-next-line
        // @ts-ignore
        errorCode: '110',
      },
      reason: 'Unauthorized',
    });
    const restartedStep = restartedRegistrationStep;

    const result = shouldPopulateWithPreviousCallbacks(nextStep, undefined, restartedStep, 1);

    expect(result).toBeFalsy();
  });

  it('should return undefined if generic 401', () => {
    const nextStep = new FRLoginFailure({
      code: 401,
      reason: 'Unauthorized',
    });
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
    const nextStep = new FRLoginFailure({
      code: 401,
      detail: {
        // eslint-disable-next-line
        // @ts-ignore
        errorCode: '110',
      },
      reason: 'Unauthorized',
    });
    const previousStep = previousRegistrationStep;
    const restartedStep = new FRLoginFailure({
      code: 401,
      reason: 'Unauthorized',
    });

    const result = shouldPopulateWithPreviousCallbacks(
      nextStep,
      previousStep.callbacks,
      restartedStep,
      1,
    );

    expect(result).toBeFalsy();
  });

  it('should return false because it is neither 1 nor a Constrained Violation', () => {
    const nextStep = new FRLoginFailure({
      code: 401,
      reason: 'Unauthorized',
    });
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

  it('should identify a step ready to be self-submitted', () => {
    const result = isStepReadyToSubmit([
      {
          "isFirstInvalidInput": false,
          "isReadyForSubmission": true,
          "isSelfSubmittingCb": true,
          "isUserInputRequired": false,
          "idx": 0
      },
      {
          "isFirstInvalidInput": false,
          "isReadyForSubmission": true,
          "isSelfSubmittingCb": true,
          "isUserInputRequired": false,
          "idx": 1
      }
    ]);
    expect(result).toBe(true);
  });

  it('should identify a step NOT ready to be self-submitted', () => {
    const result = isStepReadyToSubmit([
      {
          "isFirstInvalidInput": false,
          "isReadyForSubmission": false,
          "isSelfSubmittingCb": true,
          "isUserInputRequired": false,
          "idx": 0
      },
      {
          "isFirstInvalidInput": false,
          "isReadyForSubmission": true,
          "isSelfSubmittingCb": true,
          "isUserInputRequired": false,
          "idx": 1
      }
    ]);
    expect(result).toBe(false);
  });
});
