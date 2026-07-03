/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Produces a CSS `calc()` expression that replicates the `color` library's
 * relative lighten/darken math for any token value.
 *
 * lighten(ratio) → L × (1 + ratio)
 * darken(ratio)  → L × (1 − ratio)
 */
function relativeLightness(lightnessVar, op, ratio) {
  const factor = op === 'lighten' ? 1 + ratio : 1 - ratio;
  const rounded = Math.round(factor * 1e10) / 1e10;
  return `calc(var(${lightnessVar}) * ${rounded})`;
}

module.exports = { relativeLightness };
