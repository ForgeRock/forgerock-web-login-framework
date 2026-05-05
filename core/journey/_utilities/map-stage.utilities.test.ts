/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

// Isolate the core mapping logic from any demo overrides in the custom registry.
vi.mock('./custom-registry', () => ({
  customStageRegistry: {},
  customCallbackRegistry: {},
}));

import { mapStepToStage } from './map-stage.utilities';
import { step1, step3 } from './step.mock';

import Generic from '$journey/stages/generic.svelte';
import Login from '$journey/stages/login.svelte';
import { createJourneyStep } from '$journey/_utilities/step.mock';
import { createMixedLoginWebAuthnStep } from '$journey/stages/mfa-stages.mock';
import type { Step } from '@forgerock/journey-client/types';

describe('Test mapping of step to stage', () => {
  it('should map to a given stage for a known step', () => {
    const result = mapStepToStage(step3);

    expect(result).toStrictEqual(Login);
  });

  it('should map to a generic stage for an unknown step', () => {
    const result = mapStepToStage(step1);

    expect(result).toStrictEqual(Generic);
  });

  it('maps mixed login WebAuthn steps without a stage to Login', () => {
    const mixed = createMixedLoginWebAuthnStep('auth-no-stage');
    const { stage: _ignored, ...payloadWithoutStage } = mixed.payload as Step;
    const mixedWithoutStage = createJourneyStep(payloadWithoutStage as Step);

    const result = mapStepToStage(mixedWithoutStage);
    expect(result).toStrictEqual(Login);
  });
});
