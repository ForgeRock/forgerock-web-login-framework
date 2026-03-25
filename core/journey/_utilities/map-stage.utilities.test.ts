/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

import { mapStepToStage } from './map-stage.utilities';
import { step1, step3 } from './step.mock';

import Generic from '$journey/stages/generic.svelte';
import Login from '$journey/stages/login.svelte';

describe('Test mapping of step to stage', () => {
  it('should map to a given stage for a known step', () => {
    const result = mapStepToStage(step3);

    expect(result).toStrictEqual(Login);
  });

  it('should map to a generic stage for an unknown step', () => {
    const result = mapStepToStage(step1);

    expect(result).toStrictEqual(Generic);
  });
});

vi.mock('./custom-registry', () => ({
  customStages: {
    CustomLogin: { __isCustomStage: true },
  },
  customCallbacks: {},
}));

describe('mapStepToStage with custom registry', () => {
  it('returns custom stage when stage name matches registry', () => {
    const mockStep = {
      type: 'Step',
      getStage: () => 'CustomLogin',
      callbacks: [],
      getCallbacksOfType: () => [],
    } as unknown as Parameters<typeof mapStepToStage>[0];

    const result = mapStepToStage(mockStep);
    expect((result as Record<string, unknown>).__isCustomStage).toBe(true);
  });

  it('falls back to built-in stages when no custom match', () => {
    const mockStep = {
      type: 'Step',
      getStage: () => 'DefaultLogin',
      callbacks: [],
      getCallbacksOfType: () => [],
    } as unknown as Parameters<typeof mapStepToStage>[0];

    const result = mapStepToStage(mockStep);
    expect(result).toBeDefined();
    expect((result as Record<string, unknown>).__isCustomStage).toBeUndefined();
  });

  it('falls back to Generic when stage name is empty and step is unknown', () => {
    const mockStep = {
      type: 'Step',
      getStage: () => '',
      callbacks: [],
      getCallbacksOfType: () => [],
    } as unknown as Parameters<typeof mapStepToStage>[0];

    const result = mapStepToStage(mockStep);
    expect(result).toStrictEqual(Generic);
  });
});
