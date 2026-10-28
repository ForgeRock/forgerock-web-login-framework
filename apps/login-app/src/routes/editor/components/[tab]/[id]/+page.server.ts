/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { error } from '@sveltejs/kit';
import { Effect } from 'effect';

import { getComponent } from '$lib/server/custom-components/api/api';
import { ComponentApiLive } from '$lib/server/custom-components/runtime';
import { findTab } from '../../tabs';

import type { PageServerLoad } from './$types';

/**
 * Loads the record to edit. The [tab] segment selects the record type the tab shows;
 * the record's own id picks the entry. Unknown tab or failed fetch → error.
 */
export const load: PageServerLoad = async ({ params, request }) => {
  const tab = findTab(params.tab);
  if (!tab) {
    throw error(404, `Unknown component tab: ${params.tab}`);
  }
  // The editor needs the concrete API type; for layout tabs the id exists in
  // exactly one of the tab's types — resolve by fetching until found.
  for (const type of tab.types) {
    const response = await Effect.runPromise(
      Effect.provide(getComponent(request, type, params.id), ComponentApiLive),
    );
    if (response.status === 404) {
      continue;
    }
    if (!response.ok) {
      throw error(response.status, `Failed to load component: ${await response.text()}`);
    }
    return { tabId: tab.id, type, id: params.id, record: await response.json() };
  }
  throw error(404, 'Component not found');
};
