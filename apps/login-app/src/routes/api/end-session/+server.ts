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
  fetchAm,
  getAmCookie,
  pickUpstreamHeaders,
  resolveOAuthRealmPath,
  resolveUpstreamQuery,
  upstreamFailureResponse,
} from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetchAm(
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
  if (response.kind === 'failure') return upstreamFailureResponse(response);

  if (response.ok) clearAmCookie(event.cookies);

  return new Response(response.body, {
    status: response.status,
    headers: pickUpstreamHeaders(response.headers, ['content-type']),
  });
};
