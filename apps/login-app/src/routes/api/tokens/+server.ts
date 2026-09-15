/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$core/constants';
import { resolveOAuthRealmPath } from '$server/am-session';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const body = await event.request.text();

  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetch(`${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/access_token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);
  responseHeaders.set('cache-control', 'no-store');

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
};
