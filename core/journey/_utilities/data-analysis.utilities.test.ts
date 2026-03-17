/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { CallbackType, FRStep } from '@forgerock/javascript-sdk';
import { describe, expect, it } from 'vitest';

import { isStepReadyToSubmit, requiresUserInput } from './data-analysis.utilities';

describe('Test data analysis functions for step and callback', () => {
  it('should identify a step ready to be self-submitted', () => {
    const result = isStepReadyToSubmit([
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: true,
          isSelfSubmitting: true,
          isUserInputRequired: false,
        },
        idx: 0,
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: true,
          isSelfSubmitting: true,
          isUserInputRequired: false,
        },
        idx: 1,
      },
    ]);
    expect(result).toBe(true);
  });

  it('should identify a step NOT ready to be self-submitted', () => {
    const result = isStepReadyToSubmit([
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: false,
          isSelfSubmitting: true,
          isUserInputRequired: false,
        },
        idx: 0,
      },
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          isReadyForSubmission: true,
          isSelfSubmitting: true,
          isUserInputRequired: false,
        },
        idx: 1,
      },
    ]);
    expect(result).toBe(false);
  });

  it('should identify TextInputCallback as requiring user input', () => {
    const step = new FRStep({
      authId: 'test-auth-id',
      callbacks: [
        {
          type: CallbackType.TextInputCallback,
          output: [{ name: 'prompt', value: 'Enter value' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
      stage: 'Login',
    });

    const callback = step.getCallbackOfType(CallbackType.TextInputCallback);

    if (!callback) {
      throw new Error('Expected TextInputCallback to exist on test step');
    }

    expect(requiresUserInput(callback)).toBe(true);
  });
});
