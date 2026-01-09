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
  const bodyStream = event?.request?.body;
  const body = bodyStream?.getReader().read();
  const bodyString = body?.toString();

  // console.log('Revoke request body:');
  // console.log(bodyString);

  const response = await fetch(`${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/token/revoke`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: bodyString,
  });

  const resBody = await response.text();
  // console.log(response);

  return new Response(resBody);
};
