import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import type { StepCookieData } from '$server/cookie-crypto';

import { buildAmQueryString, buildAmRequestBody, mergeFormDataIntoStep } from './step-mapper';

// ─── mergeFormDataIntoStep ───────────────────────────────────────────────────

describe('mergeFormDataIntoStep', () => {
  it('mergeFormData_UsernameAndPassword_SetsInputValues', () => {
    // Arrange
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'PasswordCallback',
          output: [{ name: 'prompt', value: 'Password' }],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
      ],
      stage: 'UsernamePassword',
    };
    const formData = new FormData();
    formData.set('IDToken1', 'jsmith');
    formData.set('IDToken2', 's3cret');

    // Act
    const result = mergeFormDataIntoStep(stepData, formData);

    // Assert
    expect(result.step.callbacks[0].input[0].value).toBe('jsmith');
    expect(result.step.callbacks[1].input[0].value).toBe('s3cret');
  });

  it('mergeFormData_ChoiceCallback_CoercesToNumber', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'ChoiceCallback',
          output: [
            { name: 'prompt', value: 'Choose one' },
            { name: 'choices', value: ['Option A', 'Option B'] },
            { name: 'defaultChoice', value: 0 },
          ],
          input: [{ name: 'IDToken1', value: 0 }],
          _id: 0,
        },
      ],
    };
    const formData = new FormData();
    formData.set('IDToken1', '1');

    const result = mergeFormDataIntoStep(stepData, formData);

    expect(result.step.callbacks[0].input[0].value).toBe(1);
  });

  it('mergeFormData_TermsAndConditions_CoercesToBoolean', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'TermsAndConditionsCallback',
          output: [
            { name: 'terms', value: 'Accept these terms...' },
            { name: 'version', value: '1.0' },
          ],
          input: [{ name: 'IDToken1', value: false }],
          _id: 0,
        },
      ],
    };

    // Test "true" string
    const formData = new FormData();
    formData.set('IDToken1', 'true');
    const result = mergeFormDataIntoStep(stepData, formData);
    expect(result.step.callbacks[0].input[0].value).toBe(true);

    // Test "on" (HTML checkbox value)
    const formData2 = new FormData();
    formData2.set('IDToken1', 'on');
    const result2 = mergeFormDataIntoStep(stepData, formData2);
    expect(result2.step.callbacks[0].input[0].value).toBe(true);
  });

  it('mergeFormData_UncheckedCheckbox_DefaultsToFalse', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'TermsAndConditionsCallback',
          output: [{ name: 'terms', value: 'Accept these terms...' }],
          input: [{ name: 'IDToken1', value: false }],
          _id: 0,
        },
      ],
    };
    // Empty FormData (checkbox unchecked = absent)
    const formData = new FormData();

    const result = mergeFormDataIntoStep(stepData, formData);

    expect(result.step.callbacks[0].input[0].value).toBe(false);
  });

  it('mergeFormData_BooleanAttributeInput_CoercesToBoolean', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'BooleanAttributeInputCallback',
          output: [{ name: 'name', value: 'preferences/marketing' }],
          input: [{ name: 'IDToken3', value: false }],
          _id: 2,
        },
      ],
    };
    const formData = new FormData();
    formData.set('IDToken3', '1');

    const result = mergeFormDataIntoStep(stepData, formData);

    expect(result.step.callbacks[0].input[0].value).toBe(true);
  });

  it('mergeFormData_MultiInputCallback_MergesAllInputs', () => {
    // KBA-style callback with question + answer
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'KbaCreateCallback',
          output: [
            { name: 'prompt', value: 'Select a question' },
            {
              name: 'predefinedQuestions',
              value: ['What is your pet?', 'What is your city?'],
            },
          ],
          input: [
            { name: 'IDToken1question', value: '' },
            { name: 'IDToken1answer', value: '' },
          ],
          _id: 0,
        },
      ],
    };
    const formData = new FormData();
    formData.set('IDToken1question', 'What is your pet?');
    formData.set('IDToken1answer', 'Fluffy');

    const result = mergeFormDataIntoStep(stepData, formData);

    expect(result.step.callbacks[0].input[0].value).toBe('What is your pet?');
    expect(result.step.callbacks[0].input[1].value).toBe('Fluffy');
  });

  it('mergeFormData_HiddenValueCallback_PreservesExistingValue', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'HiddenValueCallback',
          output: [{ name: 'id', value: 'csrf' }],
          input: [{ name: 'IDToken5', value: 'existing-csrf-token' }],
          _id: 4,
        },
      ],
    };
    // No form field for hidden callbacks
    const formData = new FormData();

    const result = mergeFormDataIntoStep(stepData, formData);

    // Should preserve the existing value
    expect(result.step.callbacks[0].input[0].value).toBe('existing-csrf-token');
  });

  it('mergeFormData_MixedCallbacks_HandlesMixOfTypes', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'First Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'StringAttributeInputCallback',
          output: [{ name: 'prompt', value: 'Email' }],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
        {
          type: 'PasswordCallback',
          output: [{ name: 'prompt', value: 'Password' }],
          input: [{ name: 'IDToken3', value: '' }],
          _id: 2,
        },
        {
          type: 'BooleanAttributeInputCallback',
          output: [{ name: 'name', value: 'preferences/marketing' }],
          input: [{ name: 'IDToken4', value: false }],
          _id: 3,
        },
      ],
      authIndexType: 'service',
      authIndexValue: 'Registration',
    };
    const formData = new FormData();
    formData.set('IDToken1', 'Jane');
    formData.set('IDToken2', 'jane@example.com');
    formData.set('IDToken3', 'P@ssw0rd!');
    // IDToken4 checkbox left unchecked (absent)

    const result = mergeFormDataIntoStep(stepData, formData);

    expect(result.step.callbacks[0].input[0].value).toBe('Jane');
    expect(result.step.callbacks[1].input[0].value).toBe('jane@example.com');
    expect(result.step.callbacks[2].input[0].value).toBe('P@ssw0rd!');
    expect(result.step.callbacks[3].input[0].value).toBe(false);
    // Metadata preserved
    expect(result.step.authIndexType).toBe('service');
    expect(result.step.authIndexValue).toBe('Registration');
  });

  it('mergeFormData_ConfirmationCallback_CoercesToNumber', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'ConfirmationCallback',
          output: [
            { name: 'options', value: ['Submit', 'Cancel'] },
            { name: 'optionType', value: -1 },
          ],
          input: [{ name: 'IDToken1', value: 0 }],
          _id: 0,
        },
      ],
    };
    const formData = new FormData();
    formData.set('IDToken1', '0');

    const result = mergeFormDataIntoStep(stepData, formData);

    expect(result.step.callbacks[0].input[0].value).toBe(0);
  });

  it('mergeFormData_ChoiceCallbackNaN_FallsBackToStringValue', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'ChoiceCallback',
          output: [
            { name: 'prompt', value: 'Choose one' },
            { name: 'choices', value: ['Option A', 'Option B'] },
          ],
          input: [{ name: 'IDToken1', value: 0 }],
          _id: 0,
        },
      ],
    };
    const formData = new FormData();
    formData.set('IDToken1', 'not-a-number');

    const result = mergeFormDataIntoStep(stepData, formData);

    // NaN falls back to the original string
    expect(result.step.callbacks[0].input[0].value).toBe('not-a-number');
  });

  it('mergeFormData_FileInput_PreservesExistingValue', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
    };
    const formData = new FormData();
    // Simulate a File value (FormData.get returns File for file inputs)
    formData.set('IDToken1', new File(['content'], 'test.txt'));

    const result = mergeFormDataIntoStep(stepData, formData);

    // File values are not strings — the original value should be preserved
    expect(result.step.callbacks[0].input[0].value).toBe('');
  });

  it('mergeFormData_DoesNotMutateOriginal_ReturnsNewObject', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
    };
    const formData = new FormData();
    formData.set('IDToken1', 'test');

    const result = mergeFormDataIntoStep(stepData, formData);

    // Original should be unchanged
    expect(stepData.callbacks[0].input[0].value).toBe('');
    expect(result.step.callbacks[0].input[0].value).toBe('test');
  });
});

// ─── buildAmRequestBody ──────────────────────────────────────────────────────

describe('buildAmRequestBody', () => {
  it('buildAmRequestBody_ValidStep_ProducesCorrectJson', () => {
    const stepData: StepCookieData = {
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: 'jsmith' }],
          _id: 0,
        },
      ],
    };

    const body = Effect.runSync(buildAmRequestBody('jwt-auth-id-here', stepData));
    const parsed = JSON.parse(body);

    expect(parsed.authId).toBe('jwt-auth-id-here');
    expect(parsed.callbacks).toHaveLength(1);
    expect(parsed.callbacks[0].input[0].value).toBe('jsmith');
  });
});

// ─── buildAmQueryString ──────────────────────────────────────────────────────

describe('buildAmQueryString', () => {
  it('buildAmQueryString_WithBothParams_ReturnsQueryString', () => {
    const stepData: StepCookieData = {
      callbacks: [],
      authIndexType: 'service',
      authIndexValue: 'Login',
    };

    const qs = buildAmQueryString(stepData);

    expect(qs).toContain('authIndexType=service');
    expect(qs).toContain('authIndexValue=Login');
  });

  it('buildAmQueryString_NoParams_ReturnsEmptyString', () => {
    const stepData: StepCookieData = { callbacks: [] };

    const qs = buildAmQueryString(stepData);

    expect(qs).toBe('');
  });

  it('buildAmQueryString_OnlyType_ReturnsPartialString', () => {
    const stepData: StepCookieData = {
      callbacks: [],
      authIndexType: 'service',
    };

    const qs = buildAmQueryString(stepData);

    expect(qs).toBe('authIndexType=service');
  });
});
