/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { error } from '@sveltejs/kit';

import { findTab } from '../tabs';

import type { PageLoad } from './$types';

/** A list entry: the record plus the type it was listed under. */
interface Entry {
  type: string;
  record: {
    id: string;
    src: string;
    meta: {
      name: string;
      displayName: string;
      modifiedDate: string;
    };
  };
}

/**
 *   tabId = 'layout'  →  loads headers + footers + containers, merged
 *   tabId = 'stage'   →  loads stages only
 * Unknown tab segments 404 — a path names a resource, it cannot default.
 */
export const load: PageLoad = async ({ params, fetch: eventFetch }) => {
  const tab = findTab(params.tab);
  if (!tab) {
    throw error(404, `Unknown component tab: ${params.tab}`);
  }

  // Same-origin: pass SvelteKit's fetch so relative /api URLs work server- and client-side.
  const results = await Promise.allSettled(
    tab.types.map(async (type) => {
      const response = await eventFetch(`/api/components/${type}`);
      // A type with no records directory yet 404s — an empty list, not a failure.
      if (response.status === 404) {
        return [] as Entry[];
      }
      if (!response.ok) {
        throw new Error(`Failed to load ${type}`);
      }
      const records = (await response.json()) as Entry['record'][];
      return records.map((record): Entry => ({ type, record }));
    }),
  );

  const failed = results.some((result) => result.status === 'rejected');
  const entries: Entry[] = failed
    ? []
    : results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  return { tabId: tab.id, tabTypes: tab.types, entries, failed };
};
