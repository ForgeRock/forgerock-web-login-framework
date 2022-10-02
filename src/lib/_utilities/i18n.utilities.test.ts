import { describe, expect, it } from 'vitest';

import { getLocale, interpolate, textToKey } from './i18n.utilities';
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

describe('Test text-to-key function', () => {
  it('Should convert single letter to key', () => {
    const key = textToKey('a');
    const expected = 'a';
    expect(key).toBe(expected);
  });

  it('Should convert single number string to key', () => {
    const key = textToKey('1');
    const expected = '1';
    expect(key).toBe(expected);
  });

  it('Should convert single number number to key', () => {
    const key = textToKey(1);
    const expected = '1';
    expect(key).toBe(expected);
  });

  it('Should convert PascalCase to camelCase key', () => {
    const key = textToKey('UserName');
    const expected = 'userName';
    expect(key).toBe(expected);
  });

  it('Should convert single lowercased word to key', () => {
    const key = textToKey('hello');
    const expected = 'hello';
    expect(key).toBe(expected);
  });

  it('Should convert single capitalized word to key', () => {
    const key = textToKey('Hello');
    const expected = 'hello';
    expect(key).toBe(expected);
  });

  it('Should convert single uppercased word to key', () => {
    const key = textToKey('HELLO');
    const expected = 'hello';
    expect(key).toBe(expected);
  });

  it('Should convert single uppercased word with ! to key', () => {
    const key = textToKey('HELLO!!');
    const expected = 'hello';
    expect(key).toBe(expected);
  });

  it('Should convert title case to key', () => {
    const key = textToKey('For Whom The Bell Tolls');
    const expected = 'forWhomTheBellTolls';
    expect(key).toBe(expected);
  });

  it('Should convert sentence case to key', () => {
    const key = textToKey('Buy some tomatoes');
    const expected = 'buySomeTomatoes';
    expect(key).toBe(expected);
  });

  it('Should convert sentence case and numbers to key', () => {
    const key = textToKey('Buy me 4 tomatoes');
    const expected = 'buyMe4Tomatoes';
    expect(key).toBe(expected);
  });

  it('Should convert sentence case with punctuation to key', () => {
    const key = textToKey('Please, buy some tomatoes.');
    const expected = 'pleaseBuySomeTomatoes';
    expect(key).toBe(expected);
  });

  it('Should convert sentence case with apostrophe to key', () => {
    const key = textToKey("Don't buy eggs.");
    const expected = 'dontBuyEggs';
    expect(key).toBe(expected);
  });

  it('Should convert sentence case with censored words to key', () => {
    const key = textToKey('Please, I really need #@$^#&# tomatoes.');
    const expected = 'pleaseIReallyNeedTomatoes';
    expect(key).toBe(expected);
  });

  it('Should convert letters delimited by slash into key', () => {
    const key = textToKey('a/b/c');
    const expected = 'aBC';
    expect(key).toBe(expected);
  });

  it('Should convert words delimited by slash into key', () => {
    const key = textToKey('alpha/beta/charlie');
    const expected = 'alphaBetaCharlie';
    expect(key).toBe(expected);
  });

  it('Should convert words delimited by comma into key', () => {
    const key = textToKey('alpha,beta,charlie');
    const expected = 'alphaBetaCharlie';
    expect(key).toBe(expected);
  });

  it('Should PRESERVE words delimited by underscore into key', () => {
    const key = textToKey('alpha_beta_charlie');
    const expected = 'alpha_beta_charlie';
    expect(key).toBe(expected);
  });
});
