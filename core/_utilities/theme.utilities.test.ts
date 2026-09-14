/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import {
  buildThemeVarsEntries,
  encodeCssUrl,
  hexToHslChannels,
  resolvePageTheme,
} from './theme.utilities';

describe('encodeCssUrl', () => {
  it('wraps a plain URL in url("…")', () => {
    expect(encodeCssUrl('https://example.com/logo.png')).toBe(
      'url("https://example.com/logo.png")',
    );
  });

  it('percent-encodes double-quotes to prevent breaking out of the quoted url()', () => {
    const result = encodeCssUrl('https://x.test/a.png");background:url("https://evil.test/x.png');
    expect(result).not.toContain('");background');
    expect(result).toContain('%22');
    // The whole value stays inside a single quoted url("…") token.
    expect(result.startsWith('url("')).toBe(true);
    expect(result.endsWith('")')).toBe(true);
  });

  it('encodes every double-quote, not just the first', () => {
    expect(encodeCssUrl('a"b"c')).toBe('url("a%22b%22c")');
  });
});

describe('buildThemeVarsEntries', () => {
  it('returns empty array for empty theme', () => {
    expect(buildThemeVarsEntries({})).toEqual([]);
  });

  it('returns both light and dark primary HSL entries from primaryColor', () => {
    const entries = buildThemeVarsEntries({ primaryColor: '#ff0000' });
    expect(entries).toContainEqual(['--tw-colors-primary-dark-hs', '0, 100%']);
    expect(entries).toContainEqual(['--tw-colors-primary-light-hs', '0, 100%']);
    expect(entries).toContainEqual(['--tw-colors-primary-dark-l', '50%']);
    expect(entries).toContainEqual(['--tw-colors-primary-light-l', '50%']);
  });

  it('returns --fr-button-border-radius from buttonBorderRadius', () => {
    const entries = buildThemeVarsEntries({ buttonBorderRadius: 8 });
    expect(entries).toContainEqual(['--fr-button-border-radius', '8px']);
  });

  it('returns --fr-input-bg-color from inputBgColor', () => {
    const entries = buildThemeVarsEntries({ inputBgColor: '#ffffff' });
    expect(entries).toContainEqual(['--fr-input-bg-color', '#ffffff']);
  });

  it('returns logo vars using encodeCssUrl', () => {
    const entries = buildThemeVarsEntries({ logo: 'https://example.com/logo.png' });
    expect(entries).toContainEqual(['--logo-light', 'url("https://example.com/logo.png")']);
    expect(entries).toContainEqual(['--logo-dark', 'url("https://example.com/logo.png")']);
  });

  it('silently skips invalid hex fields', () => {
    const entries = buildThemeVarsEntries({ primaryColor: undefined });
    expect(entries).toEqual([]);
  });

  it('returns --fr-logo-height from logoHeight', () => {
    const entries = buildThemeVarsEntries({ logoHeight: 40 });
    expect(entries).toContainEqual(['--fr-logo-height', '40px']);
  });

  it('omits --fr-logo-height when logoHeight is unset', () => {
    const entries = buildThemeVarsEntries({});
    const names = entries.map(([name]) => name);
    expect(names).not.toContain('--fr-logo-height');
  });

  it('returns all three secondary slot pairs from secondaryColor', () => {
    const entries = buildThemeVarsEntries({ secondaryColor: '#0000ff' });
    const names = entries.map(([name]) => name);
    expect(names).toContain('--tw-colors-secondary-dark-hs');
    expect(names).toContain('--tw-colors-secondary-default-hs');
    expect(names).toContain('--tw-colors-secondary-light-hs');
  });
});

describe('resolvePageTheme', () => {
  const catalog = {
    zardoz: { primaryColor: '#111111' },
    other: { primaryColor: '#222222' },
  };

  it('resolves a theme present in the catalog', () => {
    expect(resolvePageTheme(catalog, 'zardoz')).toEqual({ primaryColor: '#111111' });
  });

  it('returns undefined for an id not present in the catalog', () => {
    expect(resolvePageTheme(catalog, 'unknown')).toBeUndefined();
  });

  it('returns undefined when themeId is absent', () => {
    expect(resolvePageTheme(catalog, undefined)).toBeUndefined();
  });

  it('returns undefined when no catalog was supplied', () => {
    expect(resolvePageTheme(undefined, 'zardoz')).toBeUndefined();
  });

  it('does not resolve prototype-chain properties as theme ids', () => {
    expect(resolvePageTheme(catalog, '__proto__')).toBeUndefined();
    expect(resolvePageTheme(catalog, 'constructor')).toBeUndefined();
    expect(resolvePageTheme(catalog, 'toString')).toBeUndefined();
  });
});

describe('hexToHslChannels', () => {
  it('converts 6-digit hex with # prefix', () => {
    const result = hexToHslChannels('#334155');
    expect(result.hs).toMatch(/^\d+\.?\d*, \d+\.?\d*%$/);
    expect(result.l).toMatch(/^\d+\.?\d*%$/);
  });

  it('converts 6-digit hex without # prefix', () => {
    const result = hexToHslChannels('334155');
    expect(result.hs).toBe('215.3, 25%');
    expect(result.l).toBe('26.7%');
  });

  it('handles pure black', () => {
    const result = hexToHslChannels('#000000');
    expect(result.hs).toBe('0, 0%');
    expect(result.l).toBe('0%');
  });

  it('handles pure white', () => {
    const result = hexToHslChannels('#ffffff');
    expect(result.hs).toBe('0, 0%');
    expect(result.l).toBe('100%');
  });

  it('handles a saturated red', () => {
    const result = hexToHslChannels('#ff0000');
    expect(result.hs).toBe('0, 100%');
    expect(result.l).toBe('50%');
  });

  it('accepts 8-digit hex by stripping alpha channel', () => {
    const result = hexToHslChannels('#E00202BD');
    expect(result.hs).toBe('0, 98.2%');
    expect(result.l).toBe('44.3%');
  });

  it('accepts 8-digit hex without # prefix by stripping alpha', () => {
    const result8 = hexToHslChannels('FF0000FF');
    const result6 = hexToHslChannels('FF0000');
    expect(result8.hs).toBe(result6.hs);
    expect(result8.l).toBe(result6.l);
  });

  it('throws on invalid hex', () => {
    expect(() => hexToHslChannels('#xyz')).toThrow('Invalid hex color');
    expect(() => hexToHslChannels('not-a-color')).toThrow('Invalid hex color');
    expect(() => hexToHslChannels('#12345')).toThrow('Invalid hex color');
    expect(() => hexToHslChannels('#fff')).toThrow('Invalid hex color');
  });
});
