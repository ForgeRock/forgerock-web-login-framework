/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const resolveConfig = require('tailwindcss/resolveConfig');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compositions = require('./compositions.cjs');

// Resolve the real Tailwind theme so `theme(...)`/`config(...)` accessors get
// live values, matching how the build resolves them.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const resolved = resolveConfig({ presets: [require('./config.cjs')] });

const styles = compositions(
  (path: string) => resolved[path],
  (path: string) => resolved.theme[path],
);
const logoClass = styles['.dialog-logo'];
const logoDarkClass = styles['.dialog-logo_dark'];
const headerLogoClass = styles['.dialog-header']['.dialog-logo'];

describe('.dialog-logo var consumption', () => {
  it('consumes config fallback vars for light and dark backgrounds', () => {
    expect(logoClass.backgroundImage).toBe('var(--logo-light, var(--fr-logo-light-fallback))');
    expect(logoDarkClass.backgroundImage).toBe('var(--logo-dark, var(--fr-logo-dark-fallback))');
  });

  it('resolves height from --fr-logo-height with a 4.5rem default', () => {
    expect(logoClass.height).toBe('var(--fr-logo-height, 4.5rem)');
  });

  it('resolves width from --fr-logo-width with a 100% default', () => {
    expect(logoClass.width).toBe('var(--fr-logo-width, 100%)');
  });
});

describe('.dialog-header .dialog-logo header stretch', () => {
  it('inherits the header height when no --fr-logo-height is configured', () => {
    expect(headerLogoClass.height).toBe(
      'var(--fr-logo-height, var(--fr-logo-header-stretch, inherit))',
    );
  });
});

describe('.dialog-logo_no-header modal fallback', () => {
  const noHeaderLogoClass = styles['.dialog-logo_no-header'];

  it('fills its container when no --fr-logo-height is configured, matching the pre-var inline default', () => {
    expect(noHeaderLogoClass.height).toBe('var(--fr-logo-height, 100%)');
  });

  it('does not redeclare the background or width from the base .dialog-logo class', () => {
    expect(noHeaderLogoClass.backgroundImage).toBeUndefined();
    expect(noHeaderLogoClass.width).toBeUndefined();
  });
});

describe('.stage-logo stage-context fallbacks', () => {
  const stageLogoClass = styles['.stage-logo'];

  it('defaults width to 200px, matching the pre-var inline stage default', () => {
    expect(stageLogoClass.width).toBe('var(--fr-logo-width, 200px)');
  });

  it('keeps the shared height fallback of the base .dialog-logo class', () => {
    expect(stageLogoClass.height).toBeUndefined();
  });
});
