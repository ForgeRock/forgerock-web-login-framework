/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$core/constants';
import { fetchAm, resolveOAuthRealmPath } from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const body = await event.request.text();

  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetchAm(`${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/token/revoke`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  }).catch(() => new Response(JSON.stringify({ error: 'upstream_timeout' }), { status: 504 }));

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
};
