/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { initialize, styleSchema, themeSchema } from './style.store';

import type { partialStyleSchema } from './style.store';

describe('themeSchema', () => {
  it('accepts valid 6-digit hex colors', () => {
    const result = themeSchema.safeParse({ primaryColor: '#334155', backgroundColor: '#f6f8fa' });
    expect(result.success).toBe(true);
  });

  it('accepts all fields as optional — empty object is valid', () => {
    expect(themeSchema.safeParse({}).success).toBe(true);
  });

  it('drops 3-digit hex — parses but field is undefined', () => {
    const result = themeSchema.safeParse({ primaryColor: '#fff' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.primaryColor).toBeUndefined();
  });

  it('drops hex without # — parses but field is undefined', () => {
    const result = themeSchema.safeParse({ primaryColor: '334155' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.primaryColor).toBeUndefined();
  });

  it('drops non-hex string — parses but field is undefined', () => {
    const result = themeSchema.safeParse({ primaryColor: 'red' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.primaryColor).toBeUndefined();
  });

  it('rejects unknown keys (strict)', () => {
    expect(themeSchema.safeParse({ unknownField: '#ffffff' }).success).toBe(false);
  });

  it('accepts https logo URL', () => {
    expect(themeSchema.safeParse({ logo: 'https://example.com/logo.png' }).success).toBe(true);
  });

  it('accepts data:image logo URL', () => {
    expect(themeSchema.safeParse({ logo: 'data:image/png;base64,abc123==' }).success).toBe(true);
  });

  it('drops logo with embedded double-quote — parses but logo is undefined', () => {
    const result = themeSchema.safeParse({
      logo: 'https://example.com/logo.png"onload=alert(1)',
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.logo).toBeUndefined();
  });

  it('drops javascript: logo URL — parses but logo is undefined', () => {
    const result = themeSchema.safeParse({ logo: 'javascript:alert(1)' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.logo).toBeUndefined();
  });

  it('accepts valid font family string', () => {
    expect(themeSchema.safeParse({ fontFamily: "'Open Sans', sans-serif" }).success).toBe(true);
  });

  it('drops fontFamily with semicolon — parses but field is undefined', () => {
    const result = themeSchema.safeParse({ fontFamily: 'Arial; color: red' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.fontFamily).toBeUndefined();
  });

  it('drops fontFamily with brace — parses but field is undefined', () => {
    const result = themeSchema.safeParse({ fontFamily: 'Arial } body { color: red' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.fontFamily).toBeUndefined();
  });

  it('drops relative logo URL — other fields still parse correctly', () => {
    const result = themeSchema.safeParse({
      primaryColor: '#5AA625',
      logo: 'img/placeholder.95d0bb8e.svg',
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.primaryColor).toBe('#5AA625');
    expect(result.success && result.data.logo).toBeUndefined();
  });

  it('accepts numeric buttonBorderRadius', () => {
    expect(themeSchema.safeParse({ buttonBorderRadius: 5 }).success).toBe(true);
  });

  it('rejects string buttonBorderRadius', () => {
    expect(themeSchema.safeParse({ buttonBorderRadius: '5px' }).success).toBe(false);
  });

  it('accepts valid https favicon URL', () => {
    const result = themeSchema.safeParse({ favicon: 'https://example.com/favicon.ico' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.favicon).toBe('https://example.com/favicon.ico');
  });

  it('drops invalid favicon string (not URL) — parses but field is undefined', () => {
    const result = themeSchema.safeParse({ favicon: 'not-a-url' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.favicon).toBeUndefined();
  });

  it('accepts all Group D fields together', () => {
    const result = themeSchema.safeParse({
      primaryOffColor: '#374151',
      fontFamily: 'Inter',
      buttonBorderRadius: 8,
      cardBorderRadius: 12,
      inputTextColor: '#111827',
      cardTextColor: '#1f2937',
      bodyTextColor: '#374151',
      buttonTextColor: '#ffffff',
    });
    expect(result.success).toBe(true);
  });
});

describe('styleSchema — theme field', () => {
  it('accepts styleSchema with valid theme', () => {
    const result = styleSchema.safeParse({
      theme: { primaryColor: '#027ab8' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts styleSchema without theme', () => {
    expect(styleSchema.safeParse({}).success).toBe(true);
  });

  it('drops invalid color field nested inside styleSchema — theme parsed with field undefined', () => {
    const result = styleSchema.safeParse({ theme: { primaryColor: 'not-hex' } });
    expect(result.success).toBe(true);
    expect(result.success && result.data.theme?.primaryColor).toBeUndefined();
  });
});

describe('styleSchema — themeCatalog field', () => {
  it('accepts styleSchema with a valid themeCatalog', () => {
    const result = styleSchema.safeParse({
      themeCatalog: { 'idm-theme-id': { primaryColor: '#027ab8' } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts styleSchema without themeCatalog', () => {
    expect(styleSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a themeCatalog with multiple entries keyed by id', () => {
    const result = styleSchema.safeParse({
      themeCatalog: {
        'theme-a': { primaryColor: '#027ab8' },
        'theme-b': { primaryColor: '#5aa625' },
      },
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.themeCatalog?.['theme-a']?.primaryColor).toBe('#027ab8');
    expect(result.success && result.data.themeCatalog?.['theme-b']?.primaryColor).toBe('#5aa625');
  });

  it('rejects a themeCatalog entry with unknown keys (strict theme entries)', () => {
    const result = styleSchema.safeParse({
      themeCatalog: { 'theme-a': { unknownField: '#027ab8' } },
    });
    expect(result.success).toBe(false);
  });

  it('drops invalid color inside a catalog entry — entry parsed with field undefined', () => {
    const result = styleSchema.safeParse({
      themeCatalog: { 'theme-a': { primaryColor: 'not-hex' } },
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.themeCatalog?.['theme-a']?.primaryColor).toBeUndefined();
  });
});

describe('initialize', () => {
  it('merges theme into store when provided', () => {
    const store = initialize({ theme: { primaryColor: '#027ab8' } });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.theme?.primaryColor).toBe('#027ab8');
  });

  it('resets to fallback when called with no argument', () => {
    initialize({ theme: { primaryColor: '#027ab8' } });
    const store = initialize();
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.theme).toBeUndefined();
  });

  it('strips undefined theme — does not pollute store with undefined keys', () => {
    const store = initialize({ checksAndRadios: 'standard' });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.checksAndRadios).toBe('standard');
    expect(value?.theme).toBeUndefined();
  });

  it('drops an invalid nested color field rather than storing it unparsed', () => {
    const store = initialize({ theme: { primaryColor: 'not-hex' } });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.theme?.primaryColor).toBeUndefined();
  });

  it('resets to fallback when passed a value that fails schema validation', () => {
    initialize({ theme: { primaryColor: '#027ab8' } });
    // @ts-expect-error — intentionally invalid input to exercise the safeParse failure path
    const store = initialize({ checksAndRadios: 'not-a-valid-option' });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.checksAndRadios).toBe('animated');
    expect(value?.theme).toBeUndefined();
  });

  it('merges a valid themeCatalog into the store', () => {
    const store = initialize({ themeCatalog: { 'theme-a': { primaryColor: '#027ab8' } } });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.themeCatalog?.['theme-a']?.primaryColor).toBe('#027ab8');
  });

  it('merges a valid textOutput script hide directive into the store', () => {
    const store = initialize({ callbacks: { textOutput: { script: 'hidden' } } });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.callbacks?.textOutput).toStrictEqual({ script: 'hidden' });
  });

  it('drops an invalid textOutput directive rather than storing it unparsed', () => {
    initialize({ callbacks: { textOutput: { script: 'hidden' } } });
    // @ts-expect-error — intentionally invalid input to exercise the safeParse failure path
    const store = initialize({ callbacks: { textOutput: { script: 'visible' } } });
    let value: ReturnType<typeof partialStyleSchema.parse> | undefined;
    store.subscribe((v) => (value = v))();
    expect(value?.callbacks).toBeUndefined();
  });
});
