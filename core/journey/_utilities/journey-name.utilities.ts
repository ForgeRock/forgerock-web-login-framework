/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { StartParam } from '@forgerock/journey-client/types';

/**
 * @function deriveJourneyName - Derives the current journey name from the journey stack.
 * @param {array} stack - The journey stack entries (latest entry last)
 * @returns {string} - The latest entry's `journey`, or `''` for the AM default journey
 */
export function deriveJourneyName(stack: StartParam[]): string {
  const latest = stack[stack.length - 1];
  return latest?.journey ?? '';
}
