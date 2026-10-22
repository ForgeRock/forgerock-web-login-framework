/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { error } from '@sveltejs/kit';

import type { PageLoad } from './$types';

/** Loads the record to edit from the Component API. */
export const load: PageLoad = async ({ params, fetch: eventFetch }) => {
  const response = await eventFetch(`/api/components/${params.type}/${params.id}`);
  if (!response.ok) {
    throw error(response.status, `Failed to load component: ${await response.text()}`);
  }
  return { type: params.type, id: params.id, record: await response.json() };
};
