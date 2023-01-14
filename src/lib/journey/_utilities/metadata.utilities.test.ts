import { describe, expect, it } from 'vitest';

import { buildCallbackMetadata, buildStepMetadata } from './metadata.utilities';
import { step } from './step.mock';

describe('Test metadata builder functions', () => {
  it('should have metadata without stage attributes', () => {
    const result = buildCallbackMetadata(step, () => false, null);

    expect(result).toStrictEqual([
      {
        canForceUserInputOptionality: undefined,
        idx: 0,
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: false,
        isUserInputRequired: true,
      },
      {
        canForceUserInputOptionality: undefined,
        idx: 1,
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: false,
        isUserInputRequired: true,
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
    const result = buildCallbackMetadata(step, () => false, stageJson);

    expect(result).toStrictEqual([
      {
        canForceUserInputOptionality: undefined,
        idx: 0,
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: false,
        isUserInputRequired: true,
      },
      {
        canForceUserInputOptionality: undefined,
        confirmPassword: true,
        id: 'subNode1',
        idx: 1,
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: false,
        isUserInputRequired: true,
        policyDisplayCheckmark: true,
      },
    ]);
  });
});
