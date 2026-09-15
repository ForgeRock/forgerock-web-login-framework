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
  clearAmCookie,
  getAmCookie,
  resolveOAuthRealmPath,
  resolveUpstreamQuery,
} from '$server/am-session';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetch(
    `${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/connect/endSession${resolveUpstreamQuery(
      event.url,
    )}`,
    {
      method: 'GET',
      headers: {
        authorization: event.request.headers.get('authorization') || '',
        cookie: getAmCookie(event.cookies),
      },
    },
  );

  // The AM endSession endpoint responds 302 with a Location for RP-initiated
  // logout; a 200 means a plain JSON body. Either way, the AM session cookie
  // must be cleared once the session is gone upstream.
  if (response.ok || (response.status >= 300 && response.status < 400)) {
    clearAmCookie(event.cookies);
  }

  const responseHeaders = new Headers();
  const location = response.headers.get('location');
  if (location) responseHeaders.set('location', location);
  const contentType = response.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);
  responseHeaders.set('cache-control', 'no-store');

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
};
