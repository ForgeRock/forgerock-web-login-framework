/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$server/constants';
import {
  fetchAm,
  pickUpstreamHeaders,
  resolveOAuthRealmPath,
  upstreamFailureResponse,
} from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const body = await event.request.text();

  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetchAm(`${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/access_token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (response.kind === 'failure') return upstreamFailureResponse(response);

  return new Response(response.body, {
    status: response.status,
    headers: pickUpstreamHeaders(response.headers, ['content-type']),
  });
};
