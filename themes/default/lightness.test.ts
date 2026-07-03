/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import colorLib from 'color';
import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { relativeLightness } = require('./lightness.cjs') as {
  relativeLightness: (lightnessVar: string, op: 'lighten' | 'darken', ratio: number) => string;
};

describe('relativeLightness', () => {
  it('returns correct calc string for lighten', () => {
    expect(relativeLightness('--tw-colors-primary-light-l', 'lighten', 0.9)).toBe(
      'calc(var(--tw-colors-primary-light-l) * 1.9)',
    );
  });

  it('returns correct calc string for darken', () => {
    expect(relativeLightness('--tw-colors-primary-light-l', 'darken', 0.4)).toBe(
      'calc(var(--tw-colors-primary-light-l) * 0.6)',
    );
  });

  it('lighten factor matches colorLib relative math for primary.light', () => {
    // primary.light = colorLib(sky[600]).darken(0.075).hex() ≈ #027AB8, L ≈ 36.5%
    // colorLib.lighten(ratio) multiplies L by (1 + ratio) — not an additive offset
    const primaryLightHex = colorLib('#0ea5e9').darken(0.075).hex();
    const L = colorLib(primaryLightHex).hsl().array()[2] / 100;
    const ratio = 0.9;
    const factor = 1 + ratio;
    expect(L * factor).toBeCloseTo(
      colorLib(primaryLightHex).lighten(ratio).hsl().array()[2] / 100,
      5,
    );
  });

  it('darken factor matches colorLib relative math for primary.light', () => {
    const primaryLightHex = colorLib('#0ea5e9').darken(0.075).hex();
    const L = colorLib(primaryLightHex).hsl().array()[2] / 100;
    const ratio = 0.4;
    const factor = 1 - ratio;
    expect(L * factor).toBeCloseTo(
      colorLib(primaryLightHex).darken(ratio).hsl().array()[2] / 100,
      5,
    );
  });

  it('rounds factor to avoid floating-point noise in output', () => {
    const result = relativeLightness('--tw-colors-x-l', 'lighten', 0.3);
    // factor = 1.3 — no FP noise expected, but rounding guard must not corrupt clean values
    expect(result).toBe('calc(var(--tw-colors-x-l) * 1.3)');
  });
});
