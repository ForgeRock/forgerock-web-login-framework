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
  amProxyResponse,
  getAmCookie,
  resolveOAuthRealmPath,
  resolveUpstreamQuery,
} from '$server/am-session';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetch(
    `${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/authorize${resolveUpstreamQuery(event.url)}`,
    {
      method: 'GET',
      headers: {
        cookie: getAmCookie(event.cookies),
      },
      redirect: 'manual',
    },
  );

  // AM answers a valid authorize with a redirect; amProxyResponse relays the
  // status with an empty body and no-store, and the Location is overlaid here
  // since it carries the RP-initiated continuation, not an upstream body.
  const proxied = amProxyResponse(response, await response.text());
  const location = response.headers.get('location');
  if (location) proxied.headers.set('location', location);
  return proxied;
};
