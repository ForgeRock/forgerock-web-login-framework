import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

import ValidatedCreatePassword from './validated-create-password.svelte';

import type { ValidatedCreatePasswordCallback } from '@forgerock/journey-client/types';

import type { CallbackMetadata } from '$journey/journey.interfaces';

function passwordCallback(requirements: string[]) {
  const policies = {
    name: 'password',
    policyRequirements: requirements,
    policies: requirements.map((requirement) => ({
      policyRequirements: [requirement],
      policyId: requirement === 'MIN_LENGTH' ? 'minimum-length' : 'valid-type',
      params: requirement === 'MIN_LENGTH' ? { minLength: 8 } : { types: ['string'] },
    })),
  };
  const payload = {
    type: 'ValidatedCreatePasswordCallback',
    input: [{ name: 'IDToken3', value: '' }],
  };
  const setInputValue = vi.fn();
  const callback = {
    payload,
    getType: () => 'ValidatedCreatePasswordCallback',
    getPrompt: () => 'Password',
    getInputValue: () => '',
    getPolicies: () => policies,
    getFailedPolicies: () => [],
    setInputValue,
  } as unknown as ValidatedCreatePasswordCallback;
  return { callback, payload, setInputValue };
}

describe('validated password collection', () => {
  it.each([
    ['captured invited-admin callback', ['VALID_TYPE']],
    ['password length policy without a REQUIRED marker', ['VALID_TYPE', 'MIN_LENGTH']],
    ['explicit required policy', ['VALID_TYPE', 'REQUIRED']],
  ])('requires a password for %s', (_description, requirements) => {
    const { callback, payload, setInputValue } = passwordCallback(requirements as string[]);
    const before = JSON.stringify(payload);
    const { body } = render(ValidatedCreatePassword, {
      props: {
        callback,
        callbackMetadata: {
          idx: 2,
          derived: { isFirstInvalidInput: false },
          platform: {},
        } as unknown as CallbackMetadata,
        style: {},
      },
    });
    const password = body
      .match(/<input\b[^>]*>/g)
      ?.find((input) => /\btype="password"/.test(input));

    expect(password).toBeDefined();
    expect(password).toMatch(/\srequired(?:[\s=>])/);
    expect(JSON.stringify(payload)).toBe(before);
    expect(setInputValue).not.toHaveBeenCalled();
  });
});
