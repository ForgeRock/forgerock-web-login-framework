/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Journey persistence remembers the journey stack so a
 * bare-suspendedId page load (new tab) can restart into the last visit's
 * journey with the same query.
 */

import { createStorage } from '@forgerock/storage';

import type { StartParam } from '@forgerock/journey-client/types';
import type { StorageClient } from '@forgerock/storage';

let journeyStorage: StorageClient<StartParam[]> | undefined;

try {
  journeyStorage = createStorage<StartParam[]>({
    type: 'localStorage',
    name: 'journey-stack',
  });
} catch {
  // Storage unavailable — persistence is best-effort.
}

export async function readStoredStack(): Promise<StartParam[]> {
  const value = await journeyStorage?.get();
  return Array.isArray(value) ? value : [];
}

export async function writeStoredStack(stack: StartParam[]): Promise<void> {
  if (!stack.length) {
    await journeyStorage?.remove();
    return;
  }
  await journeyStorage?.set(stack);
}
