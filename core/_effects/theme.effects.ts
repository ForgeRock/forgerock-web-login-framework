/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { buildThemeVarsEntries } from '$core/_utilities/theme.utilities';

import type { ThemeObject } from '$core/style.store';

/**
 * Applies IDM theme values as CSS custom properties on a root element.
 * Full replace on every call: the element's inline `style` is cleared before
 * the new theme is applied, so switching themes (or falling through to no
 * theme) never leaves a previous theme's vars behind. Relies on nothing else
 * writing inline styles to this element.
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
