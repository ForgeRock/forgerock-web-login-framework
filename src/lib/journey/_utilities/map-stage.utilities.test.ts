import { describe, expect, it } from 'vitest';

import { mapStepToStage } from './map-stage.utilities';
import { step1, step3 } from './step.mock';

import Generic from '$journey/stages/generic.svelte';
import UsernamePassword from '$journey/stages/username-password.svelte';

describe('Test mapping of step to stage', () => {
  it('should map to a given stage for a known step', () => {
    const result = mapStepToStage(step3);

    expect(result).toStrictEqual(UsernamePassword);
  });

  it('should map to a generic stage for an unknown step', () => {
    const result = mapStepToStage(step1);

    expect(result).toStrictEqual(Generic);
  });
});
