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

export const GET: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetchAm(`${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/userinfo`, {
    method: 'POST',
    headers: {
      authorization: event.request.headers.get('authorization') || '',
    },
  });
  if (response.kind === 'failure') return upstreamFailureResponse(response);

  return new Response(response.body, {
    status: response.status,
    headers: pickUpstreamHeaders(response.headers, ['content-type']),
  });
};
