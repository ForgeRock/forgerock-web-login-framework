/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { deriveJourneyName } from './journey-name.utilities';

describe('deriveJourneyName', () => {
  it("returns '' for an empty stack", () => {
    expect(deriveJourneyName([])).toBe('');
  });

  it('returns the journey of a single stack entry', () => {
    expect(deriveJourneyName([{ journey: 'Login' }])).toBe('Login');
  });

  it('returns the journey of the latest entry in a multi-entry stack', () => {
    expect(deriveJourneyName([{ journey: 'Login' }, { journey: 'Passwordless' }])).toBe(
      'Passwordless',
    );
  });

  it('reflects a journey switch (latest entry wins, not the first)', () => {
    expect(
      deriveJourneyName([{ journey: 'Login' }, { journey: 'Login' }, { journey: 'Register' }]),
    ).toBe('Register');
  });

  it("returns '' for the AM default journey (latest entry has no journey)", () => {
    expect(deriveJourneyName([{ query: { realm: 'alpha' } }])).toBe('');
  });

  it("returns '' for a stack of undefined journey values", () => {
    expect(deriveJourneyName([{ query: {} }, {}])).toBe('');
  });

  it("returns '' when the latest entry has an empty-string journey", () => {
    expect(deriveJourneyName([{ journey: 'Login' }, { journey: '' }])).toBe('');
  });
});
