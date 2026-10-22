/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import type { PageLoad } from './$types';
import type { ComponentRecord } from '$lib/api';

/** A list entry: the record plus the type it was listed under. */
interface Entry {
  type: string;
  record: ComponentRecord;
}

/** Tabs mirror the design: Stage Components | Callback Components | Layout. */
const TABS: ReadonlyArray<{ id: string; types: readonly string[] }> = [
  { id: 'stage', types: ['stages'] },
  { id: 'callback', types: ['callbacks'] },
  { id: 'layout', types: ['headers', 'footers', 'containers'] },
];

/** Loads the active tab's records through the Component API. */
export const load: PageLoad = async ({ url, fetch: eventFetch }) => {
  const requested = url.searchParams.get('tab');
  const tabId = TABS.some((tab) => tab.id === requested) ? requested! : 'stage';
  const tab = TABS.find((candidate) => candidate.id === tabId)!;

  // Same-origin: pass SvelteKit's fetch so relative /api URLs work in any context.
  const lists = await Promise.all(
    tab.types.map(async (type) => {
      const response = await eventFetch(`/api/components/${type}`);
      // A type with no records directory yet 404s — an empty list, not a failure.
      if (response.status === 404) {
        return [] as Entry[];
      }
      if (!response.ok) {
        return 'error' as const;
      }
      const records = (await response.json()) as ComponentRecord[];
      return records.map((record): Entry => ({ type, record }));
    }),
  );

  const failed = lists.some((list) => list === 'error');
  const entries: Entry[] = failed
    ? []
    : lists.filter((list): list is Entry[] => list !== 'error').flat();
  return { tabId, tabTypes: tab.types, entries, failed };
};
