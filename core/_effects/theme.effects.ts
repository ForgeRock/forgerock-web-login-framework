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
 * Noop when `theme` is undefined or the element reference is null.
 */
export function applyThemeVars(rootEl: HTMLElement | null, theme: ThemeObject | undefined): void {
  if (!rootEl || !theme) return;
  for (const [name, value] of buildThemeVarsEntries(theme)) {
    rootEl.style.setProperty(name, value);
  }
}
