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
vi.mock('./registry/custom-registry', () => ({
  customStageRegistry: {},
  customCallbackRegistry: {},
}));

import { createJourneyStep } from '$journey/_utilities/step.mock';
import Generic from '$journey/stages/generic.svelte';
import Login from '$journey/stages/login.svelte';
import { createMixedLoginWebAuthnStep } from '$journey/stages/mfa-stages.mock';
import { mapStepToStage } from './map-stage.utilities';
import { step1, step3 } from './step.mock';

import type { Step } from '@forgerock/journey-client/types';

import type { CustomRegistryEntry } from './registry/registry.interfaces';

// Typed as the entry's component shape: a test fake only needs to be
// callable, and a bare `function Foo() {}` does not satisfy Svelte's
// Component type.
const fakeRuntimeComponent = (name: string) =>
  ({ [name]: function FakeRuntimeStage() {} })[name] as unknown as CustomRegistryEntry['component'];

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

  it('maps a runtime bundle stage by stage name', () => {
    const runtimeComponent = fakeRuntimeComponent('RuntimeStage');
    const runtimeStage = mapStepToStage(
      step3,
      {},
      {
        DefaultLogin: { component: runtimeComponent, acceptedProps: [] },
      },
    );

    expect(runtimeStage).toBe(runtimeComponent);
  });

  it('prefers a runtime bundle stage over a compile-time registry stage with the same name', () => {
    const runtimeComponent = fakeRuntimeComponent('RuntimeDefaultLogin');
    const runtimeStage = mapStepToStage(
      step3,
      {},
      {
        DefaultLogin: { component: runtimeComponent, acceptedProps: [] },
      },
    );

    expect(runtimeStage).toBe(runtimeComponent);
  });

  it('ignores an empty runtime registry (default behavior)', () => {
    const result = mapStepToStage(step3, {}, {});

    expect(result).toStrictEqual(Login);
  });

  it('ignores a runtime stage whose name does not match', () => {
    const runtimeComponent = fakeRuntimeComponent('OtherStage');
    const result = mapStepToStage(
      step3,
      {},
      {
        Unrelated: { component: runtimeComponent, acceptedProps: [] },
      },
    );

    expect(result).toStrictEqual(Login);
  });
});
