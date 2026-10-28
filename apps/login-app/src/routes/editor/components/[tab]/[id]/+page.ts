/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { error } from '@sveltejs/kit';

import { findTab } from '../../tabs';

import type { PageLoad } from './$types';

/**
 * Loads the record to edit. The [tab] segment selects the record type the tab
 * shows; the record's own id picks the entry. Unknown tab or failed fetch → error.
 */
export const load: PageLoad = async ({ params, fetch: eventFetch }) => {
  const tab = findTab(params.tab);
  if (!tab) {
    throw error(404, `Unknown component tab: ${params.tab}`);
  }
  // The editor needs the concrete API type; for layout tabs the id exists in
  // exactly one of the tab's types — resolve by fetching until found.
  for (const type of tab.types) {
    let response: Response;
    try {
      response = await eventFetch(`/api/components/${type}/${params.id}`);
    } catch (cause) {
      throw error(
        502,
        `Failed to reach the Component API: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      );
    }
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
