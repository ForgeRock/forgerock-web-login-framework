/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import {
  createMixedLoginWebAuthnStep,
  createPasskeyAutofillStep,
  livePasskeyAutofillStep,
  stepWithInvalidMetadata,
  webAuthnAuthenticationStep,
} from '$journey/stages/mfa-stages.mock';
import { usernamePasswordStep } from '$journey/stages/step.mock';
import {
  getAutocompleteValues,
  isMixedLoginWebAuthnStep,
  isPasskeyAutofillStep,
} from './webauthn.utilities';

import type { Step } from '@forgerock/journey-client/types';

describe('getAutocompleteValues', () => {
  it('returns empty array for an undefined step', () => {
    expect(getAutocompleteValues(undefined)).toEqual([]);
  });

  it('returns empty array when NameCallback has no autocompleteValues output', () => {
    expect(getAutocompleteValues(createJourneyStep(usernamePasswordStep))).toEqual([]);
  });

  it('returns autocomplete values from the NameCallback', () => {
    expect(getAutocompleteValues(createPasskeyAutofillStep())).toEqual(['username', 'webauthn']);
  });
});

// Structural check — is this a mixed-login WebAuthn authentication step (drives stage routing)?
describe('isMixedLoginWebAuthnStep', () => {
  it('returns false for an undefined step', () => {
    expect(isMixedLoginWebAuthnStep(undefined)).toBe(false);
  });

  it('identifies a mixed login plus WebAuthn authentication step', () => {
    expect(isMixedLoginWebAuthnStep(createPasskeyAutofillStep())).toBe(true);
  });

  it('identifies a mixed login WebAuthn step without autofill enabled (000 case)', () => {
    expect(isMixedLoginWebAuthnStep(createMixedLoginWebAuthnStep())).toBe(true);
  });

  it('returns false for a standard login step', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(usernamePasswordStep))).toBe(false);
  });

  it('does not treat a dedicated WebAuthn stage as a mixed login step', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(webAuthnAuthenticationStep as Step))).toBe(
      false,
    );
  });

  it('returns true for the live DefaultLogin authentication payload', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(livePasskeyAutofillStep))).toBe(true);
  });

  it('returns false when the WebAuthn outcome callback is missing', () => {
    const callbacks = livePasskeyAutofillStep.callbacks;

    if (!callbacks) {
      throw new Error('Test fixture livePasskeyAutofillStep is missing callbacks');
    }

    expect(
      isMixedLoginWebAuthnStep(
        createJourneyStep({
          ...livePasskeyAutofillStep,
          callbacks: callbacks.slice(0, 2),
        }),
      ),
    ).toBe(false);
  });

  it('returns false when the metadata callback has an invalid data payload', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(stepWithInvalidMetadata))).toBe(false);
  });
});

// AM-eligibility check — has AM enabled passkey autofill (autocomplete values + conditional mediation)?
describe('isPasskeyAutofillStep', () => {
  it('returns false for an undefined step', () => {
    expect(isPasskeyAutofillStep(undefined)).toBe(false);
  });

  it('returns true when both autocomplete values and conditional mediation are enabled', () => {
    expect(isPasskeyAutofillStep(createPasskeyAutofillStep())).toBe(true);
    expect(isPasskeyAutofillStep(createJourneyStep(livePasskeyAutofillStep))).toBe(true);
  });

  it('returns false for a standard login step (no autocomplete values)', () => {
    expect(isPasskeyAutofillStep(createJourneyStep(usernamePasswordStep))).toBe(false);
  });

  it('returns false when autocomplete values are set but conditional mediation is not', () => {
    const callbacks = livePasskeyAutofillStep.callbacks;

    if (!callbacks) {
      throw new Error('Test fixture livePasskeyAutofillStep is missing callbacks');
    }

    // Strip `mediation` from the metadata payload — the "100" case: autofillable field, no request.
    const withoutMediation = callbacks.map((callback) => {
      if (callback.type !== 'MetadataCallback') {
        return callback;
      }
      const data = callback.output.find((output) => output.name === 'data')?.value as Record<
        string,
        unknown
      >;
      const { mediation: _mediation, ...dataWithoutMediation } = data;
      return {
        ...callback,
        output: [{ name: 'data', value: dataWithoutMediation }],
      };
    });

    expect(
      isPasskeyAutofillStep(
        createJourneyStep({
          ...livePasskeyAutofillStep,
          callbacks: withoutMediation,
        } as Step),
      ),
    ).toBe(false);
  });
});
