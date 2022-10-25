import { describe, expect, it } from 'vitest';

import { isStepReadyToSubmit } from './metadata.utilities';

describe('Test metadata functions for step and callback', () => {
  it('should identify a step ready to be self-submitted', () => {
    const result = isStepReadyToSubmit([
      {
        isFirstInvalidInput: false,
        isReadyForSubmission: true,
        isSelfSubmitting: true,
        isUserInputRequired: false,
        idx: 0,
      },
      {
        isFirstInvalidInput: false,
        isReadyForSubmission: true,
        isSelfSubmitting: true,
        isUserInputRequired: false,
        idx: 1,
      },
    ]);
    expect(result).toBe(true);
  });

  it('should identify a step NOT ready to be self-submitted', () => {
    const result = isStepReadyToSubmit([
      {
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: true,
        isUserInputRequired: false,
        idx: 0,
      },
      {
        isFirstInvalidInput: false,
        isReadyForSubmission: true,
        isSelfSubmitting: true,
        isUserInputRequired: false,
        idx: 1,
      },
    ]);
    expect(result).toBe(false);
  });
});
