import { describe, expect, it } from 'vitest';
import { expandTilde } from '../src/services/file-system.js';

describe('expandTilde', () => {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '~';

  it('expands ~/... paths', () => {
    expect(expandTilde('~/Documents/projects/foo')).toBe(`${home}/Documents/projects/foo`);
  });

  it('expands bare ~', () => {
    expect(expandTilde('~')).toBe(home);
  });

  it('leaves absolute paths unchanged', () => {
    expect(expandTilde('/Users/gabriel/foo')).toBe('/Users/gabriel/foo');
  });

  it('leaves relative paths unchanged', () => {
    expect(expandTilde('./foo/bar')).toBe('./foo/bar');
    expect(expandTilde('foo/bar')).toBe('foo/bar');
  });

  it('does not expand ~ in the middle of a path', () => {
    expect(expandTilde('/foo/~/bar')).toBe('/foo/~/bar');
  });
});
