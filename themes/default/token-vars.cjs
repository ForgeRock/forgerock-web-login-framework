/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

const colorLib = require('color');

const TOKEN_MAPPINGS = [
  ['colors.background.dark', 'background-dark'],
  ['colors.background.light', 'background-light'],
  ['colors.body.dark', 'body-dark'],
  ['colors.body.light', 'body-light'],
  ['colors.error.dark', 'error-dark'],
  ['colors.error.light', 'error-light'],
  ['colors.focus.DEFAULT', 'focus-default'],
  ['colors.header.dark', 'header-dark'],
  ['colors.header.light', 'header-light'],
  ['colors.label.dark', 'label-dark'],
  ['colors.label.light', 'label-light'],
  ['colors.link.dark', 'link-dark'],
  ['colors.link.light', 'link-light'],
  ['colors.primary.dark', 'primary-dark'],
  ['colors.primary.light', 'primary-light'],
  ['colors.primary.off', 'primary-off'],
  ['colors.secondary.dark', 'secondary-dark'],
  ['colors.secondary.DEFAULT', 'secondary-default'],
  ['colors.secondary.light', 'secondary-light'],
  ['colors.success.dark', 'success-dark'],
  ['colors.success.light', 'success-light'],
  ['colors.tertiary.dark', 'tertiary-dark'],
  ['colors.tertiary.light', 'tertiary-light'],
  ['colors.warning.dark', 'warning-dark'],
  ['colors.warning.light', 'warning-light'],
];

function hexToHslChannels(hex) {
  const c = colorLib(hex);
  const [h, s, l] = c.hsl().color;
  return {
    hs: `${Math.round(h * 10) / 10}, ${Math.round(s * 10) / 10}%`,
    l: `${Math.round(l * 10) / 10}%`,
  };
}

/**
 * Builds the --tw-colors-* CSS custom property map from resolved Tailwind token values.
 * @param {function} theme - Tailwind's theme() resolver
 * @returns {Record<string, string>}
 */
function buildTokenVars(theme) {
  const vars = {};
  for (const [tokenPath, varName] of TOKEN_MAPPINGS) {
    const hex = theme(tokenPath);
    if (!hex) continue;
    try {
      const { hs, l } = hexToHslChannels(hex);
      vars[`--tw-colors-${varName}-hs`] = hs;
      vars[`--tw-colors-${varName}-l`] = l;
    } catch {
      // skip invalid hex
    }
  }
  return vars;
}

module.exports = { buildTokenVars };
