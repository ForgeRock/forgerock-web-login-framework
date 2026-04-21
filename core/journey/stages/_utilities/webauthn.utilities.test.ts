/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { Step } from '@forgerock/journey-client/types';
import { describe, expect, it } from 'vitest';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { usernamePasswordStep } from '$journey/stages/step.mock';
import {
  liveMixedLoginWebAuthnStep,
  webAuthnAuthenticationStep,
  createMixedLoginWebAuthnStep,
  stepWithInvalidMetadata,
} from '$journey/stages/mfa-stages.mock';

import { isMixedLoginWebAuthnStep } from './webauthn.utilities';

describe('WebAuthn helper utilities', () => {
  it('returns false for an undefined step', () => {
    expect(isMixedLoginWebAuthnStep(undefined)).toBe(false);
  });

  it('identifies a mixed login plus WebAuthn authentication step', () => {
    expect(isMixedLoginWebAuthnStep(createMixedLoginWebAuthnStep())).toBe(true);
  });

  it('does not treat a standard login step as passkey autofill eligible', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(usernamePasswordStep))).toBe(false);
  });

  it('does not treat a dedicated WebAuthn stage as a mixed login step', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(webAuthnAuthenticationStep as Step))).toBe(
      false,
    );
  });

  it('treats the live DefaultLogin authentication payload as passkey autofill eligible', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(liveMixedLoginWebAuthnStep))).toBe(true);
  });

  it('ignores metadata callbacks that do not contain an object data payload', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(stepWithInvalidMetadata))).toBe(false);
  });
});
