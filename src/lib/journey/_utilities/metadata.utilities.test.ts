import { describe, expect, it } from 'vitest';

import { buildCallbackMetadata, buildStepMetadata } from './metadata.utilities';
import { step1, step2 } from './step.mock';

describe('Test metadata builder function for callbacks', () => {
  it('should have metadata without stage attributes', () => {
    const result = buildCallbackMetadata(step1, () => false, null);

    expect(result).toStrictEqual([
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 0,
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 1,
      },
    ]);
  });

  it('should have metadata with stage attributes', () => {
    const stageJson = {
      themeId: 'zardoz',
      ValidatedCreatePasswordCallback: [
        { id: 'subNode1', confirmPassword: true, policyDisplayCheckmark: true },
      ],
    };
    const result = buildCallbackMetadata(step1, () => false, stageJson);

    expect(result).toStrictEqual([
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 0,
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 1,
        platform: {
          confirmPassword: true,
          id: 'subNode1',
          policyDisplayCheckmark: true,
        },
      },
    ]);
  });

  it('should have metadata with stage attributes', () => {
    const stageJson = {
      themeId: 'zardoz',
      ValidatedCreatePasswordCallback: [
        { id: 'subNode1', confirmPassword: false },
        { id: 'subNode2', confirmPassword: true },
      ],
    };
    const result = buildCallbackMetadata(step2, () => false, stageJson);

    expect(result).toStrictEqual([
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 0,
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 1,
        platform: {
          confirmPassword: false,
          id: 'subNode1',
        },
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 2,
        platform: {
          confirmPassword: true,
          id: 'subNode2',
        },
      },
    ]);
  });
});

describe('Test metadata builder function for step', () => {
  it('should have metadata without stage attributes', () => {
    const callbackMetadata = [
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 0,
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 1,
        platform: {
          confirmPassword: false,
          id: 'subNode1',
        },
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: false,
          isUserInputRequired: true,
        },
        idx: 2,
        platform: {
          confirmPassword: true,
          id: 'subNode2',
        },
      },
    ];
    const stageJson = {
      themeId: 'zardoz',
      ValidatedCreatePasswordCallback: [
        { id: 'subNode1', confirmPassword: true, policyDisplayCheckmark: true },
      ],
    };
    const result = buildStepMetadata(callbackMetadata, stageJson);

    expect(result).toStrictEqual({
      derived: {
        isStepSelfSubmittable: false,
        isUserInputOptional: false,
        numOfCallbacks: 3,
        numOfSelfSubmittableCbs: 0,
        numOfUserInputCbs: 3,
      },
      platform: {
        themeId: 'zardoz',
      },
    });
  });
});
