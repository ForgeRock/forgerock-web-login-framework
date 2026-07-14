/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { createPasskeyAutofillStep } from '$journey/stages/mfa-stages.mock';
import { buildCallbackMetadata, buildStepMetadata } from './metadata.utilities';
import { createJourneyStep, step1, step2 } from './step.mock';

describe('Test metadata builder function for callbacks', () => {
  it('should have metadata without stage attributes', () => {
    const result = buildCallbackMetadata(step1, () => false, null);

    expect(result).toStrictEqual([
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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

  it('should populate autocompleteValues from a passkey autofill step', () => {
    const step = createPasskeyAutofillStep();
    const result = buildCallbackMetadata(step, () => false, null);

    const autocompleteValues = result.map((cb) => cb.derived.autocompleteValues);
    expect(autocompleteValues.every((value) => value === 'username webauthn')).toBe(true);
  });
});

describe('Test metadata builder function for callbacks with initializationOptions', () => {
  const captchaStep = createJourneyStep({
    authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
    callbacks: [
      {
        type: 'ReCaptchaCallback',
        output: [{ name: 'recaptchaSiteKey', value: 'test-site-key' }],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
    ],
    status: 200,
  });

  const enterpriseStep = createJourneyStep({
    authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
    callbacks: [
      {
        type: 'ReCaptchaEnterpriseCallback',
        output: [
          { name: 'recaptchaSiteKey', value: 'enterprise-site-key' },
          { name: 'captchaApiUri', value: 'https://www.google.com/recaptcha/enterprise.js' },
          { name: 'captchaDivClass', value: 'g-recaptcha' },
        ],
        input: [
          { name: 'IDToken1token', value: '' },
          { name: 'IDToken1action', value: '' },
        ],
        _id: 0,
      },
    ],
    status: 200,
  });

  it('should attach initOptions.mode to ReCaptchaCallback when captcha config provided', () => {
    const result = buildCallbackMetadata(captchaStep, () => false, null, {
      captcha: { mode: 'invisible' },
    });

    expect(result[0].initOptions).toStrictEqual({ mode: 'invisible' });
  });

  it('should attach initOptions.mode to ReCaptchaEnterpriseCallback when captcha config provided', () => {
    const result = buildCallbackMetadata(enterpriseStep, () => false, null, {
      captcha: { mode: 'visible' },
    });

    expect(result[0].initOptions).toStrictEqual({ mode: 'visible' });
  });

  it('should attach initOptions.recaptchaAction when provided', () => {
    const result = buildCallbackMetadata(captchaStep, () => false, null, {
      recaptchaAction: 'LOGIN',
    });

    expect(result[0].initOptions).toStrictEqual({ recaptchaAction: 'LOGIN' });
  });

  it('should merge captcha config and recaptchaAction into initOptions', () => {
    const result = buildCallbackMetadata(captchaStep, () => false, null, {
      captcha: { mode: 'invisible' },
      recaptchaAction: 'SIGNUP',
    });

    expect(result[0].initOptions).toStrictEqual({ mode: 'invisible', recaptchaAction: 'SIGNUP' });
  });

  it('should not attach initOptions when initializationOptions is null', () => {
    const result = buildCallbackMetadata(captchaStep, () => false, null, null);

    expect(result[0].initOptions).toBeUndefined();
  });

  it('should not attach initOptions when captcha config and recaptchaAction are absent', () => {
    const result = buildCallbackMetadata(captchaStep, () => false, null, {
      someOtherOption: true,
    });

    expect(result[0].initOptions).toBeUndefined();
  });
});

describe('Test metadata builder function for step', () => {
  it('should have metadata without stage attributes', () => {
    const callbackMetadata = [
      {
        derived: {
          canForceUserInputOptionality: false,
          isFirstInvalidInput: false,
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
          autocompleteValues: undefined,
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
    expect(result).toEqual({
      derived: {
        /**
         * Unlike the other properties, `isStepSelfSubmittable` is a function,
         * so for `toEqual` to pass, the "expected" object needs to reference
         * the same function as the `result` object.
         *
         * TODO: Modify this to assert against the returned value, rather than
         * relying on function reference.
         */
        isStepSelfSubmittable: result.derived.isStepSelfSubmittable,
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
