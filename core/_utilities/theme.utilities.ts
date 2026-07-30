/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { StyleObject, ThemeObject } from '$core/style.store';

/**
 * Resolves a Page Node `themeId` against a widget-supplied theme catalog.
 * Returns `undefined` when the id is absent, unresolved, or no catalog was supplied.
 */
export function resolvePageTheme(
  themeCatalog: StyleObject['themeCatalog'] | undefined,
  themeId: string | undefined,
): ThemeObject | undefined {
  if (!themeCatalog || !themeId || !Object.hasOwn(themeCatalog, themeId)) {
    return undefined;
  }
  return themeCatalog[themeId];
}

/**
 * Builds a safe CSS `url("…")` value from an untrusted URL string.
 *
 * The widget injects consumer- and IDM-supplied logo URLs into inline `style`
 * attributes as `url("<value>")`. A raw `"` in the value would close the quoted
 * string early and let an attacker append arbitrary CSS declarations. We
 * percent-encode the only character that can break out of the quoted form (`"`),
 * which a URL never needs literally. Returns the full `url("…")` token ready to
 * drop into a declaration.
 */
export function encodeCssUrl(url: string): string {
  return `url("${url.replace(/"/g, '%22')}")`;
}

/**
 * Converts a CSS hex color string to HSL channel pair strings matching the
 * --tw-colors-*-hs / --tw-colors-*-l slot format used in compiled component classes.
 *
 * Returns `{ hs: "H, S%", l: "L%" }` — the two values are kept separate because
 * component classes reference them independently (e.g. `calc(var(--tw-colors-*-l) - 10%)`).
 *
 * Accepts 6-digit hex strings (#RRGGBB or RRGGBB). Throws on anything else.
 */
export function hexToHslChannels(hex: string): { hs: string; l: string } {
  let normalized = hex.startsWith('#') ? hex.slice(1) : hex;

  if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
    normalized = normalized.slice(0, 6);
  }

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    hue = Math.round(hue * 600) / 10;
    if (hue < 0) hue += 360;
  }

  const saturation =
    delta === 0 ? 0 : Math.round((delta / (1 - Math.abs(2 * lightness - 1))) * 1000) / 10;

  const lightnessPercent = Math.round(lightness * 1000) / 10;

  return {
    hs: `${hue}, ${saturation}%`,
    l: `${lightnessPercent}%`,
  };
}

/**
 * Maps an IDM theme object to a flat list of CSS custom property name/value
 * pairs. Invalid or missing fields are silently omitted.
 */
export function buildThemeVarsEntries(theme: ThemeObject): [string, string][] {
  const entries: [string, string][] = [];

  const cssVar = (name: string, value: string): void => {
    entries.push([name, value]);
  };

  const hslPair = (hsVar: string, lVar: string, hex: string): void => {
    try {
      const { hs, l } = hexToHslChannels(hex);
      entries.push([hsVar, hs], [lVar, l]);
    } catch {
      // invalid hex — skip
    }
  };

  const hslCompound = (varName: string, hex: string): void => {
    try {
      const { hs, l } = hexToHslChannels(hex);
      cssVar(varName, `hsl(${hs}, ${l})`);
    } catch {
      // invalid hex — skip
    }
  };

  const hslSlotWithCompound = (baseName: string, hex: string): void => {
    try {
      const { hs, l } = hexToHslChannels(hex);
      cssVar(`${baseName}-hs`, hs);
      cssVar(`${baseName}-l`, l);
      cssVar(baseName, `hsl(var(${baseName}-hs), var(${baseName}-l))`);
    } catch {
      // invalid hex — skip
    }
  };

  if (theme.primaryColor) {
    hslPair('--tw-colors-primary-dark-hs', '--tw-colors-primary-dark-l', theme.primaryColor);
    hslPair('--tw-colors-primary-light-hs', '--tw-colors-primary-light-l', theme.primaryColor);
  }
  if (theme.primaryOffColor) {
    hslPair('--tw-colors-primary-off-hs', '--tw-colors-primary-off-l', theme.primaryOffColor);
  }
  if (theme.secondaryColor) {
    hslPair('--tw-colors-secondary-dark-hs', '--tw-colors-secondary-dark-l', theme.secondaryColor);
    hslPair(
      '--tw-colors-secondary-default-hs',
      '--tw-colors-secondary-default-l',
      theme.secondaryColor,
    );
    hslPair(
      '--tw-colors-secondary-light-hs',
      '--tw-colors-secondary-light-l',
      theme.secondaryColor,
    );
  }
  if (theme.backgroundColor) {
    hslPair(
      '--tw-colors-background-dark-hs',
      '--tw-colors-background-dark-l',
      theme.backgroundColor,
    );
    hslPair(
      '--tw-colors-background-light-hs',
      '--tw-colors-background-light-l',
      theme.backgroundColor,
    );
    cssVar('--fr-page-bg-color', theme.backgroundColor);
  }
  if (theme.linkColor) {
    hslPair('--tw-colors-link-dark-hs', '--tw-colors-link-dark-l', theme.linkColor);
  }
  if (theme.linkActiveColor) {
    hslPair('--tw-colors-link-light-hs', '--tw-colors-link-light-l', theme.linkActiveColor);
  }
  if (theme.fontFamily) {
    cssVar('--fr-font-family', theme.fontFamily);
  }
  if (theme.buttonBorderRadius !== undefined) {
    cssVar('--fr-button-border-radius', `${theme.buttonBorderRadius}px`);
  }
  if (theme.cardBorderRadius !== undefined) {
    cssVar('--fr-card-border-radius', `${theme.cardBorderRadius}px`);
  }
  if (theme.cardBgColor) {
    cssVar('--fr-card-bg-color', theme.cardBgColor);
  }
  if (theme.inputBgColor) {
    cssVar('--fr-input-bg-color', theme.inputBgColor);
  }
  if (theme.inputBorderColor) {
    cssVar('--fr-input-border', `1px solid ${theme.inputBorderColor}`);
    cssVar('--fr-input-border-color-value', theme.inputBorderColor);
  }
  if (theme.inputLabelColor) {
    cssVar('--fr-input-label-color', theme.inputLabelColor);
  }
  if (theme.selectAccentColor) {
    cssVar('--fr-select-accent-color', theme.selectAccentColor);
  }
  if (theme.selectHoverBgColor) {
    cssVar('--fr-select-hover-bg-color', theme.selectHoverBgColor);
  }
  if (theme.inputFocusRingColor) {
    // Only set --fr-focus-ring-color — do NOT touch --tw-colors-focus-default-*
    // which is the shared global used by all focusable elements (buttons, links, etc.)
    // as their at-rest outline-color transition start. Polluting it would cause all
    // non-input elements to start their focus transition from the input color.
    hslCompound('--fr-focus-ring-color', theme.inputFocusRingColor);
  }
  if (theme.buttonFocusRingColor) {
    hslCompound('--fr-button-focus-ring-color', theme.buttonFocusRingColor);
  }
  if (theme.inputTextColor) hslSlotWithCompound('--fr-input-text-color', theme.inputTextColor);
  if (theme.cardTextColor) hslSlotWithCompound('--fr-card-text-color', theme.cardTextColor);
  if (theme.bodyTextColor) hslSlotWithCompound('--fr-body-text-color', theme.bodyTextColor);
  if (theme.buttonTextColor) hslSlotWithCompound('--fr-button-text-color', theme.buttonTextColor);
  if (theme.logo) {
    const safeLogoUrl = encodeCssUrl(theme.logo);
    cssVar('--logo-light', safeLogoUrl);
    cssVar('--logo-dark', safeLogoUrl);
  }
  if (theme.logoHeight !== undefined) {
    cssVar('--fr-logo-height', `${theme.logoHeight}px`);
  }

  return entries;
}
