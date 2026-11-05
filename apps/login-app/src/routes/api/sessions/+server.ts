/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$server/constants';
import {
  clearAmCookie,
  fetchAm,
  getAmCookie,
  pickUpstreamHeaders,
  resolveJsonRealmPath,
  resolveUpstreamQuery,
  upstreamFailureResponse,
} from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetchAm(
    `${AM_DOMAIN_PATH}${resolveJsonRealmPath(realm)}/sessions${resolveUpstreamQuery(event.url)}`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-api-version': 'protocol=1.0,resource=2.0',
        'x-requested-with': 'XMLHttpRequest',
        cookie: getAmCookie(event.cookies),
      },
    },
  );
  if (response.kind === 'failure') return upstreamFailureResponse(response);

  if (event.url.searchParams.get('_action') === 'logout' && response.ok) {
    clearAmCookie(event.cookies);
  }

  return new Response(response.body, {
    status: response.status,
    headers: pickUpstreamHeaders(response.headers, ['content-type']),
  });
};
