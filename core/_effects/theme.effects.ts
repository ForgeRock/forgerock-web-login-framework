/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { buildLogoVarsEntries, buildThemeVarsEntries } from '$core/_utilities/theme.utilities';

import type { LogoObject, ThemeObject } from '$core/style.store';

/**
 * Applies IDM theme values as CSS custom properties on a root element.
 * Full replace on every call: the element's inline `style` is cleared before
 * the new theme is applied, so switching themes (or falling through to no
 * theme) never leaves a previous theme's vars behind. Any other writer on this
 * element (e.g. `applyLogoVars`) must run after it, since a full replace erases
 * everything.
 * Noop when the element reference is null. A `theme` of `undefined` clears
 * every themed var.
 */
export function applyThemeVars(rootEl: HTMLElement | null, theme: ThemeObject | undefined): void {
  if (!rootEl) return;
  rootEl.removeAttribute('style');
  if (!theme) return;
  for (const [name, value] of buildThemeVarsEntries(theme)) {
    rootEl.style.setProperty(name, value);
  }
}

/**
 * Applies consumer-supplied logo config as fallback CSS custom properties on a
 * root element. Unlike `applyThemeVars`, this is purely additive: it only ever
 * calls `setProperty`, never `removeAttribute('style')` and never
 * `removeProperty`. Stale values are handled by `applyThemeVars` running a full
 * replace at the start of every reactive cycle; any var this effect doesn't
 * set survives untouched, which matters for `--fr-logo-height`, the one var
 * dual-owned with the IDM theme's `logoHeight` (a config without a height must
 * not erase a theme-supplied one).
 *
 * Ordering: consumers call this after `applyThemeVars` in their reactive
 * statements, since a later full-replace by `applyThemeVars` would erase these
 * vars.
 */
export function applyLogoVars(rootEl: HTMLElement | null, logo: LogoObject | undefined): void {
  if (!rootEl) return;
  for (const [name, value] of buildLogoVarsEntries(logo)) {
    rootEl.style.setProperty(name, value);
  }
}
