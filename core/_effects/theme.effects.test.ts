/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { applyLogoVars, applyThemeVars } from '$core/_effects/theme.effects';

describe('applyThemeVars', () => {
  const makeEl = (): HTMLElement => {
    let props: Record<string, string> = {};
    return {
      removeAttribute: (name: string) => {
        if (name === 'style') props = {};
      },
      style: {
        setProperty: (name: string, value: string) => {
          props[name] = value;
        },
        removeProperty: (name: string) => {
          delete props[name];
        },
        getPropertyValue: (name: string) => props[name] ?? '',
        get length() {
          return Object.keys(props).length;
        },
      },
    } as unknown as HTMLElement;
  };

  it('is a noop when rootEl is null', () => {
    expect(() => applyThemeVars(null, { primaryColor: '#334155' })).not.toThrow();
  });

  it('sets no vars when theme is undefined and nothing was previously applied', () => {
    const el = makeEl();
    applyThemeVars(el, undefined);
    expect(el.style.length).toBe(0);
  });

  it('clears all previously applied vars when theme transitions to undefined', () => {
    const el = makeEl();
    applyThemeVars(el, { primaryColor: '#334155', cardBgColor: '#111217' });
    expect(el.style.length).toBeGreaterThan(0);
    applyThemeVars(el, undefined);
    expect(el.style.length).toBe(0);
  });

  it('clears vars set by the previous theme but absent from the new theme', () => {
    const el = makeEl();
    applyThemeVars(el, { cardBgColor: '#111217', fontFamily: 'Inter' });
    expect(el.style.getPropertyValue('--fr-card-bg-color')).toBe('#111217');
    expect(el.style.getPropertyValue('--fr-font-family')).toBe('Inter');

    applyThemeVars(el, { primaryColor: '#ff0000' });
    expect(el.style.getPropertyValue('--fr-card-bg-color')).toBe('');
    expect(el.style.getPropertyValue('--fr-font-family')).toBe('');
    expect(el.style.getPropertyValue('--tw-colors-primary-dark-hs')).toBeTruthy();
  });

  it('clears --fr-logo-height when advancing from a themed step to an unthemed one', () => {
    const el = makeEl();
    applyThemeVars(el, { logoHeight: 40 });
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('40px');

    applyThemeVars(el, undefined);
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('');
  });

  it('sets primary color HSL slots on both light and dark vars', () => {
    const el = makeEl();
    applyThemeVars(el, { primaryColor: '#334155' });
    expect(el.style.getPropertyValue('--tw-colors-primary-dark-hs')).toBe('215.3, 25%');
    expect(el.style.getPropertyValue('--tw-colors-primary-dark-l')).toBe('26.7%');
    expect(el.style.getPropertyValue('--tw-colors-primary-light-hs')).toBe('215.3, 25%');
    expect(el.style.getPropertyValue('--tw-colors-primary-light-l')).toBe('26.7%');
  });

  it('sets primaryOffColor on its own independent slot', () => {
    const el = makeEl();
    applyThemeVars(el, { primaryOffColor: '#374151' });
    expect(el.style.getPropertyValue('--tw-colors-primary-off-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-primary-off-l')).toBeTruthy();
  });

  it('sets backgroundColor on both light and dark slots and --fr-page-bg-color', () => {
    const el = makeEl();
    applyThemeVars(el, { backgroundColor: '#f6f8fa' });
    expect(el.style.getPropertyValue('--tw-colors-background-light-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-background-dark-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--fr-page-bg-color')).toBe('#f6f8fa');
  });

  it('sets linkColor on link-dark slot only', () => {
    const el = makeEl();
    applyThemeVars(el, { linkColor: '#2563eb' });
    expect(el.style.getPropertyValue('--tw-colors-link-dark-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-link-light-hs')).toBe('');
  });

  it('sets buttonBorderRadius as px value on --fr-button-border-radius', () => {
    const el = makeEl();
    applyThemeVars(el, { buttonBorderRadius: 5 });
    expect(el.style.getPropertyValue('--fr-button-border-radius')).toBe('5px');
  });

  it('sets fontFamily on --fr-font-family', () => {
    const el = makeEl();
    applyThemeVars(el, { fontFamily: 'Inter' });
    expect(el.style.getPropertyValue('--fr-font-family')).toBe('Inter');
  });

  it('sets cardBorderRadius as px value', () => {
    const el = makeEl();
    applyThemeVars(el, { cardBorderRadius: 8 });
    expect(el.style.getPropertyValue('--fr-card-border-radius')).toBe('8px');
  });

  it('sets logo on --logo-light and --logo-dark', () => {
    const el = makeEl();
    applyThemeVars(el, { logo: 'https://example.com/logo.png' });
    expect(el.style.getPropertyValue('--logo-light')).toBe('url("https://example.com/logo.png")');
    expect(el.style.getPropertyValue('--logo-dark')).toBe('url("https://example.com/logo.png")');
  });

  it('percent-encodes double-quotes in logo URL', () => {
    const el = makeEl();
    applyThemeVars(el, { logo: 'https://example.com/logo.png%22onload=alert(1)' });
    const value = el.style.getPropertyValue('--logo-light');
    expect(value).not.toContain('"onload');
    expect(value).toContain('%22');
  });

  it('sets linkActiveColor on link-light slot only', () => {
    const el = makeEl();
    applyThemeVars(el, { linkActiveColor: '#60a5fa' });
    expect(el.style.getPropertyValue('--tw-colors-link-light-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-link-dark-hs')).toBe('');
  });

  it('sets inputTextColor as HSL compound var', () => {
    const el = makeEl();
    applyThemeVars(el, { inputTextColor: '#111827' });
    expect(el.style.getPropertyValue('--fr-input-text-color-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--fr-input-text-color-l')).toBeTruthy();
    expect(el.style.getPropertyValue('--fr-input-text-color')).toMatch(/^hsl\(/);
  });

  it('sets cardTextColor as HSL compound var', () => {
    const el = makeEl();
    applyThemeVars(el, { cardTextColor: '#1f2937' });
    expect(el.style.getPropertyValue('--fr-card-text-color-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--fr-card-text-color')).toMatch(/^hsl\(/);
  });

  it('sets bodyTextColor as HSL compound var', () => {
    const el = makeEl();
    applyThemeVars(el, { bodyTextColor: '#374151' });
    expect(el.style.getPropertyValue('--fr-body-text-color-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--fr-body-text-color')).toMatch(/^hsl\(/);
  });

  it('sets buttonTextColor as HSL compound var on button text slot', () => {
    const el = makeEl();
    applyThemeVars(el, { buttonTextColor: '#ffffff' });
    expect(el.style.getPropertyValue('--fr-button-text-color-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--fr-button-text-color')).toMatch(/^hsl\(/);
  });

  it('sets primaryOffColor on independent primary-off slot', () => {
    const el = makeEl();
    applyThemeVars(el, { primaryOffColor: '#374151' });
    expect(el.style.getPropertyValue('--tw-colors-primary-off-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-primary-off-l')).toBeTruthy();
    // Must NOT set primary-dark slot
    expect(el.style.getPropertyValue('--tw-colors-primary-dark-hs')).toBe('');
  });

  it('sets inputBgColor directly on --fr-input-bg-color', () => {
    const el = makeEl();
    applyThemeVars(el, { inputBgColor: '#ffffff' });
    expect(el.style.getPropertyValue('--fr-input-bg-color')).toBe('#ffffff');
  });

  it('sets inputFocusRingColor on --fr-focus-ring-color only, not the shared focus-default slots', () => {
    const el = makeEl();
    applyThemeVars(el, { inputFocusRingColor: '#D80000' });
    expect(el.style.getPropertyValue('--fr-focus-ring-color')).toMatch(/^hsl\(/);
    // Must NOT touch --tw-colors-focus-default-* (shared by all focusable elements)
    expect(el.style.getPropertyValue('--tw-colors-focus-default-hs')).toBe('');
    expect(el.style.getPropertyValue('--tw-colors-focus-default-l')).toBe('');
  });

  it('sets buttonFocusRingColor on --fr-button-focus-ring-color as hsl()', () => {
    const el = makeEl();
    applyThemeVars(el, { buttonFocusRingColor: '#0672cb' });
    expect(el.style.getPropertyValue('--fr-button-focus-ring-color')).toMatch(/^hsl\(/);
  });

  it('sets inputLabelColor directly on --fr-input-label-color', () => {
    const el = makeEl();
    applyThemeVars(el, { inputLabelColor: '#FFFFFF' });
    expect(el.style.getPropertyValue('--fr-input-label-color')).toBe('#FFFFFF');
  });

  it('sets selectAccentColor directly on --fr-select-accent-color', () => {
    const el = makeEl();
    applyThemeVars(el, { selectAccentColor: '#0672CB' });
    expect(el.style.getPropertyValue('--fr-select-accent-color')).toBe('#0672CB');
  });

  it('sets selectHoverBgColor directly on --fr-select-hover-bg-color', () => {
    const el = makeEl();
    applyThemeVars(el, { selectHoverBgColor: '#e8f0fe' });
    expect(el.style.getPropertyValue('--fr-select-hover-bg-color')).toBe('#e8f0fe');
  });

  it('sets inputBorderColor on --fr-input-border (shorthand) and --fr-input-border-color-value', () => {
    const el = makeEl();
    applyThemeVars(el, { inputBorderColor: '#D200FF' });
    expect(el.style.getPropertyValue('--fr-input-border')).toBe('1px solid #D200FF');
    expect(el.style.getPropertyValue('--fr-input-border-color-value')).toBe('#D200FF');
  });

  it('sets cardBgColor directly on --fr-card-bg-color', () => {
    const el = makeEl();
    applyThemeVars(el, { cardBgColor: '#111217' });
    expect(el.style.getPropertyValue('--fr-card-bg-color')).toBe('#111217');
  });

  it('sets secondaryColor on all three secondary HSL slot pairs', () => {
    const el = makeEl();
    applyThemeVars(el, { secondaryColor: '#3A7BD5' });
    expect(el.style.getPropertyValue('--tw-colors-secondary-dark-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-secondary-dark-l')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-secondary-default-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-secondary-default-l')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-secondary-light-hs')).toBeTruthy();
    expect(el.style.getPropertyValue('--tw-colors-secondary-light-l')).toBeTruthy();
  });

  it('silently skips invalid hex values without throwing', () => {
    const el = makeEl();
    expect(() => applyThemeVars(el, { primaryColor: 'not-a-hex' as never })).not.toThrow();
    expect(el.style.getPropertyValue('--tw-colors-primary-dark-hs')).toBe('');
  });
});

describe('applyLogoVars', () => {
  const makeEl = (): HTMLElement & { calls: { set: string[]; remove: string[] } } => {
    let props: Record<string, string> = {};
    const calls = { set: [] as string[], remove: [] as string[] };
    return {
      calls,
      removeAttribute: (name: string) => {
        if (name === 'style') props = {};
      },
      style: {
        setProperty: (name: string, value: string) => {
          calls.set.push(name);
          props[name] = value;
        },
        removeProperty: (name: string) => {
          calls.remove.push(name);
          delete props[name];
        },
        getPropertyValue: (name: string) => props[name] ?? '',
        get length() {
          return Object.keys(props).length;
        },
      },
    } as unknown as HTMLElement & { calls: { set: string[]; remove: string[] } };
  };

  it('is a noop when rootEl is null', () => {
    expect(() => applyLogoVars(null, { light: 'https://example.com/logo.png' })).not.toThrow();
  });

  it('writes all four fallback vars from a full logo object', () => {
    const el = makeEl();
    applyLogoVars(el, {
      light: 'https://example.com/light.png',
      dark: 'https://example.com/dark.png',
      height: 48,
      width: 200,
    });
    expect(el.style.getPropertyValue('--fr-logo-light-fallback')).toBe(
      'url("https://example.com/light.png")',
    );
    expect(el.style.getPropertyValue('--fr-logo-dark-fallback')).toBe(
      'url("https://example.com/dark.png")',
    );
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('48px');
    expect(el.style.getPropertyValue('--fr-logo-width')).toBe('200px');
  });

  it('writes empty url() fallbacks when light/dark are unset', () => {
    const el = makeEl();
    applyLogoVars(el, {});
    expect(el.style.getPropertyValue('--fr-logo-light-fallback')).toBe('url("")');
    expect(el.style.getPropertyValue('--fr-logo-dark-fallback')).toBe('url("")');
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('');
    expect(el.style.getPropertyValue('--fr-logo-width')).toBe('');
  });

  it('percent-encodes double-quotes in logo URLs (injection safety)', () => {
    const el = makeEl();
    applyLogoVars(el, { light: 'https://x.test/a.png%22);background:url("https://evil.test' });
    const value = el.style.getPropertyValue('--fr-logo-light-fallback');
    expect(value).not.toContain('");background');
    expect(value).toContain('%22');
    expect(value.startsWith('url("')).toBe(true);
    expect(value.endsWith('")')).toBe(true);
  });

  it('never calls removeProperty or removeAttribute', () => {
    const el = makeEl();
    el.style.setProperty('--fr-logo-height', '40px');
    applyLogoVars(el, {});
    applyLogoVars(el, undefined);
    expect(el.calls.remove).toEqual([]);
  });

  it('does not remove --fr-logo-height written by the IDM theme when config lacks a height', () => {
    const el = makeEl();
    // Simulate the theme effect having applied theme.logoHeight=40 earlier in the cycle.
    el.style.setProperty('--fr-logo-height', '40px');
    applyLogoVars(el, { light: 'https://example.com/logo.png' });
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('40px');
  });

  it('clobbers the theme height only when the config supplies its own height', () => {
    const el = makeEl();
    el.style.setProperty('--fr-logo-height', '40px');
    applyLogoVars(el, { light: 'https://example.com/logo.png', height: 64 });
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('64px');
  });

  it('leaves theme vars on the same element intact', () => {
    const el = makeEl();
    // Simulate a theme var already on the element by writing it directly.
    el.style.setProperty('--fr-card-bg-color', '#111217');
    applyLogoVars(el, { light: 'https://example.com/logo.png' });
    expect(el.style.getPropertyValue('--fr-card-bg-color')).toBe('#111217');
    expect(el.style.getPropertyValue('--fr-logo-light-fallback')).toBe(
      'url("https://example.com/logo.png")',
    );
  });

  it('after a paired full cycle, a dropped config height is gone (theme full-replace owns cleanup)', () => {
    const el = makeEl();
    // Cycle 1: config supplies height.
    applyThemeVars(el, undefined);
    applyLogoVars(el, { light: 'https://example.com/logo.png', height: 48 });
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('48px');
    // Cycle 2: config drops height; theme effect runs first (full replace), then logo.
    applyThemeVars(el, undefined);
    applyLogoVars(el, { light: 'https://example.com/logo.png' });
    expect(el.style.getPropertyValue('--fr-logo-height')).toBe('');
    expect(el.style.getPropertyValue('--fr-logo-light-fallback')).toBe(
      'url("https://example.com/logo.png")',
    );
  });
});
