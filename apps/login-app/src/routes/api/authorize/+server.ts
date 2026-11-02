/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$core/constants';
import {
  fetchAm,
  getAmCookie,
  resolveOAuthRealmPath,
  resolveUpstreamQuery,
} from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetchAm(
    `${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/authorize${resolveUpstreamQuery(event.url)}`,
    {
      method: 'GET',
      headers: {
        cookie: getAmCookie(event.cookies),
      },
      redirect: 'manual',
    },
  ).catch(() => new Response(JSON.stringify({ error: 'upstream_timeout' }), { status: 504 }));

  const headers = new Headers();
  const location = response.headers.get('location');
  if (location) headers.set('location', location);

  return new Response(undefined, {
    status: response.status,
    headers,
  });
};
