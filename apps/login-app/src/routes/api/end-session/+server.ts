/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$core/constants';
import { resolveOAuthRealmPath } from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const response = await fetch(
    `${AM_DOMAIN_PATH}${resolveOAuthRealmPath(realm)}/connect/endSession${event.url.search}`,
    {
      method: 'GET',
      headers: {
        authorization: event.request.headers.get('authorization') || '',
      },
    },
  );

  const resBody = await response.text();
  // console.log(response);

  return new Response(resBody);
};
