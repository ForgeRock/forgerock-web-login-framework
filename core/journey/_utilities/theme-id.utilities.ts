/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * @function parseThemeId - Extracts a Page Node `themeId` from an AM `stage` attribute.
 * @param {string | null | undefined} stage - The raw `stage` value returned by `Step.getStage()`
 * @returns {string | undefined} - The resolved theme id, or `undefined` when absent or unparsable
 */
export function parseThemeId(stage: string | null | undefined): string | undefined {
  if (!stage) {
    return undefined;
  }

  if (stage.includes('{')) {
    try {
      const parsed = JSON.parse(stage) as Record<string, unknown>;
      return typeof parsed.themeId === 'string' ? parsed.themeId : undefined;
    } catch {
      return undefined;
    }
  }

  const themeIdEntry = stage.split(',').find((entry) => entry.trim().startsWith('themeId='));
  if (!themeIdEntry) {
    return undefined;
  }

  const [, value] = themeIdEntry.split('=');
  return value ? value.trim() : undefined;
}
