/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$core/constants';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const response = await fetch(`${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/userinfo`, {
    method: 'POST',
    headers: {
      authorization: event.request.headers.get('authorization') || '',
    },
  });

  const resBody = await response.text();
  // console.log(resBody);

  return new Response(resBody);
};
