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

export const POST: RequestHandler = async (event: RequestEvent) => {
  const body = await event.request.text();

  const response = await fetch(`${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/access_token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const resBody = await response.text();

  return new Response(resBody);
};
