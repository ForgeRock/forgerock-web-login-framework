import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { scaffoldComponent } from '../src/commands/generate.js';

describe('scaffoldComponent (exported)', () => {
  it('returns an Effect when called with valid arguments', () => {
    const result = scaffoldComponent('callback', 'MyCallback');
    expect(Effect.isEffect(result)).toBe(true);
  });
});
