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
  liveMixedLoginWebAuthnStep,
  stepWithInvalidMetadata,
  webAuthnAuthenticationStep,
} from '$journey/stages/mfa-stages.mock';
import { usernamePasswordStep } from '$journey/stages/step.mock';
import { isMixedLoginWebAuthnStep } from './webauthn.utilities';

import type { Step } from '@forgerock/journey-client/types';

describe('WebAuthn helper utilities', () => {
  it('returns false for an undefined step', () => {
    expect(isMixedLoginWebAuthnStep(undefined)).toBe(false);
  });

  it('identifies a mixed login plus WebAuthn authentication step', () => {
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
    expect(isMixedLoginWebAuthnStep(createJourneyStep(liveMixedLoginWebAuthnStep))).toBe(true);
  });

  it('returns false when the WebAuthn outcome callback is missing', () => {
    const callbacks = liveMixedLoginWebAuthnStep.callbacks;

    if (!callbacks) {
      throw new Error('Test fixture liveMixedLoginWebAuthnStep is missing callbacks');
    }

    expect(
      isMixedLoginWebAuthnStep(
        createJourneyStep({
          ...liveMixedLoginWebAuthnStep,
          callbacks: callbacks.slice(0, 2),
        }),
      ),
    ).toBe(false);
  });

  it('returns false when the metadata callback has an invalid data payload', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(stepWithInvalidMetadata))).toBe(false);
  });
});
