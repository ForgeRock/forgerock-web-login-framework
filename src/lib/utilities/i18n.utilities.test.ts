import { describe, expect, it } from 'vitest';

import { getLocale, interpolate } from './i18n.utilities';
import { initialize } from '$lib/locale.store';

describe('Test getLocale utility function', () => {
  it('should convert es-US locale to appropriate directory', () => {
    const dir = getLocale('es-US', '/');
    const expected = 'us/es';
    expect(dir).toBe(expected);
  });
  it('should convert fr-CA locale to appropriate directory', () => {
    const dir = getLocale('fr-CA', '/');
    const expected = 'ca/fr';
    expect(dir).toBe(expected);
  });
  it('should convert "fr-CA,fr;q-0.9" locale to appropriate directory', () => {
    const dir = getLocale('fr-CA', '/');
    const expected = 'ca/fr';
    expect(dir).toBe(expected);
  });
  it('should convert fr locale to appropriate directory', () => {
    const dir = getLocale('fr', '/');
    const expected = 'us/fr';
    expect(dir).toBe(expected);
  });
  it('should convert "" locale to appropriate fallback', () => {
    const dir = getLocale('', '/');
    const expected = 'us/en';
    expect(dir).toBe(expected);
  });
  it('should convert "unknown+locale" locale to appropriate fallback', () => {
    const dir = getLocale('unknown+locale', '/');
    const expected = 'us/en';
    expect(dir).toBe(expected);
  });
  it('should convert jp-JP locale to _ delimited string', () => {
    const string = getLocale('jp-JP', '_');
    const expected = 'jp_jp';
    expect(string).toBe(expected);
  });
  it('should convert "" locale to fallback _ delimited string', () => {
    const string = getLocale('', '_');
    const expected = 'us_en';
    expect(string).toBe(expected);
  });
});

describe('Test interpolate utility function', () => {
  initialize({
    closeModal: 'Close Modal',
    ensurePasswordIsMoreThan: 'Password requires more than {minLength} characters.',
    termsAndConditions: '<script>alert("pwned");<script>',
  });

  it('should basic string back', () => {
    const string = interpolate('closeModal');
    const expected = 'Close Modal';
    expect(string).toBe(expected);
  });
  it('should interpolate a basic string with value back', () => {
    const string = interpolate('ensurePasswordIsMoreThan', { minLength: '8' });
    const expected = 'Password requires more than 8 characters.';
    expect(string).toBe(expected);
  });
  it('should handle interpolation with missing value', () => {
    const string = interpolate('ensurePasswordIsMoreThan');
    const expected = 'Password requires more than {minLength} characters.';
    expect(string).toBe(expected);
  });
  it('should handle interpolation with unmatched key', () => {
    const string = interpolate('unknownContentKey');
    const expected = 'Unknown Content Key';
    expect(string).toBe(expected);
  });
  it('should clean dangerous script tag', () => {
    const string = interpolate('termsAndConditions');
    const expected = '&lt;script&gt;alert("pwned");&lt;script&gt;';
    expect(string).toBe(expected);
  });
});
