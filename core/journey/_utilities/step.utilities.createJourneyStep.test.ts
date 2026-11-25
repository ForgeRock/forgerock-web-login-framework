/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { createJourneyStep } from './step.utilities';

describe('createJourneyStep', () => {
  it('builds a JourneyStep from a raw AM Step payload', () => {
    const step = createJourneyStep({
      authId: 'auth-id-1',
      callbacks: [
        {
          type: 'NameCallback',
          output: [{ name: 'prompt', value: 'User Name' }],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
      header: 'Sign In',
      description: 'description',
    });

    expect(step.type).toBe('Step');
    expect(step.payload.authId).toBe('auth-id-1');
    expect(step.getHeader()).toBe('Sign In');
    expect(step.getDescription()).toBe('description');
    expect(step.getStage()).toBeUndefined();
    expect(step.callbacks).toHaveLength(1);
  });

  it('getCallbackOfType returns the single callback of a type', () => {
    const step = createJourneyStep({
      authId: 'auth-id-1',
      callbacks: [
        {
          type: 'NameCallback',
          output: [],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'PasswordCallback',
          output: [],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
      ],
    });

    const password = step.getCallbackOfType('PasswordCallback');
    expect(password.getType()).toBe('PasswordCallback');
  });

  it('getCallbackOfType throws when the type count is not exactly one', () => {
    const step = createJourneyStep({
      authId: 'auth-id-1',
      callbacks: [
        {
          type: 'NameCallback',
          output: [],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'NameCallback',
          output: [],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
      ],
    });

    expect(() => step.getCallbackOfType('NameCallback')).toThrow(
      'Expected 1 callback of type "NameCallback", but found 2',
    );
    expect(() => step.getCallbackOfType('PasswordCallback')).toThrow(
      'Expected 1 callback of type "PasswordCallback", but found 0',
    );
  });

  it('getCallbacksOfType filters callbacks by type', () => {
    const step = createJourneyStep({
      authId: 'auth-id-1',
      callbacks: [
        {
          type: 'NameCallback',
          output: [],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
        {
          type: 'NameCallback',
          output: [],
          input: [{ name: 'IDToken2', value: '' }],
          _id: 1,
        },
        {
          type: 'PasswordCallback',
          output: [],
          input: [{ name: 'IDToken3', value: '' }],
          _id: 2,
        },
      ],
    });

    const names = step.getCallbacksOfType('NameCallback');
    expect(names).toHaveLength(2);
    expect(step.getCallbacksOfType('PasswordCallback')).toHaveLength(1);
  });

  it('setCallbackValue writes the input value of the single callback of a type', () => {
    const step = createJourneyStep({
      authId: 'auth-id-1',
      callbacks: [
        {
          type: 'NameCallback',
          output: [],
          input: [{ name: 'IDToken1', value: '' }],
          _id: 0,
        },
      ],
    });

    step.setCallbackValue('NameCallback', 'jlowery');
    expect(step.callbacks[0].getInputValue()).toBe('jlowery');
  });

  it('setCallbackValue throws when the type count is not exactly one', () => {
    const step = createJourneyStep({
      authId: 'auth-id-1',
      callbacks: [],
    });

    expect(() => step.setCallbackValue('NameCallback', 'x')).toThrow(
      'Expected 1 callback of type "NameCallback", but found 0',
    );
  });
});
