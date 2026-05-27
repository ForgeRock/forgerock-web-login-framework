import { describe, expect, it } from 'vitest';

import { format__COMPONENT_NAME_PASCAL__Label } from './__COMPONENT_SLUG__.utilities.js';

describe('__COMPONENT_NAME__ utilities', () => {
  it('trims whitespace from label', () => {
    expect(format__COMPONENT_NAME_PASCAL__Label('  hello  ')).toBe('hello');
  });
});
