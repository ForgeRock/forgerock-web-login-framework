/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { parseThemeId } from './theme-id.utilities';

describe('parseThemeId', () => {
  it('parses a bare key=value themeId', () => {
    expect(parseThemeId('themeId=abc')).toBe('abc');
  });

  it('parses themeId from a multi-key comma-separated list', () => {
    expect(parseThemeId('themeId=abc,pageFooter=x,submitButtonText=y')).toBe('abc');
  });

  it('parses themeId regardless of key order in the list', () => {
    expect(parseThemeId('pageFooter=x,themeId=abc,submitButtonText=y')).toBe('abc');
  });

  it('parses themeId from a JSON object', () => {
    expect(parseThemeId('{"themeId":"abc"}')).toBe('abc');
  });

  it('parses themeId from JSON with sibling keys', () => {
    expect(parseThemeId('{"themeId":"abc","pageFooter":"x"}')).toBe('abc');
  });

  it('returns undefined for malformed JSON', () => {
    expect(parseThemeId('{"themeId":"abc"')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(parseThemeId('')).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(parseThemeId(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(parseThemeId(undefined)).toBeUndefined();
  });

  it('returns undefined for a stage with no themeId key', () => {
    expect(parseThemeId('pageFooter=x,submitButtonText=y')).toBeUndefined();
  });

  it('returns undefined for a plain stage name', () => {
    expect(parseThemeId('DefaultLogin')).toBeUndefined();
  });
});
