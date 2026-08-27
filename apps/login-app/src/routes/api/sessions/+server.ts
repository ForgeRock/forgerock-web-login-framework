/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$core/constants';
import { getAmCookie } from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm');
  const realmPath = realm
    ? `/json/realms/root/realms/${encodeURIComponent(realm)}`
    : '/json/realms/root';
  const response = await fetch(`${AM_DOMAIN_PATH}${realmPath}/sessions`, {
    method: 'POST',
    headers: {
      cookie: getAmCookie(event.cookies),
    },
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  });
};
