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
  pickUpstreamHeaders,
  resolveJsonRealmPath,
  setAmCookie,
  upstreamFailureResponse,
} from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const body = await event.request.text();
  const response = await fetchAm(
    `${AM_DOMAIN_PATH}${resolveJsonRealmPath(
      realm,
    )}/authenticate?authIndexType=service&authIndexValue=Login`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-api-version': 'protocol=1.0,resource=2.1',
        'content-type': 'application/json',
        cookie: getAmCookie(event.cookies),
      },
      body,
    },
  );
  if (response.kind === 'failure') return upstreamFailureResponse(response);

  // Deliberate: the AM session cookie is stored only after the full upstream
  // exchange succeeds, so a timed-out or reset mid-body exchange leaves no
  // partial login state. Client-invisible: SvelteKit flushes cookies when the
  // handler returns, which now always happens within the 2s budget.
  setAmCookie(event.cookies, response.headers);

  return new Response(response.body, {
    status: response.status,
    headers: pickUpstreamHeaders(response.headers, ['content-type']),
  });
};
