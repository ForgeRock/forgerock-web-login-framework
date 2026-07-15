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

import { createJourneyStep } from '$journey/_utilities/step.mock';
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
        },
        idx: 1,
      },
    ]);
    expect(result).toBe(false);
  });

  it('should identify TextInputCallback as requiring user input', () => {
    const step = createJourneyStep({
      authId: 'test-auth-id',
      callbacks: [
        {
          type: callbackType.TextInputCallback,
          output: [{ name: 'prompt', value: 'Enter value' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
      stage: 'Login',
    });

    const callback = step.getCallbackOfType(callbackType.TextInputCallback);

    if (!callback) {
      throw new Error('Expected TextInputCallback to exist on test step');
    }

    expect(requiresUserInput(callback)).toBe(true);
  });
});
