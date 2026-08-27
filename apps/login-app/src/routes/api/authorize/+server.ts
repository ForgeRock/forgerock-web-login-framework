/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$core/constants';
import { getAmCookie } from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const response = await fetch(
    `${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/authorize${event.url.search}`,
    {
      method: 'GET',
      headers: {
        cookie: getAmCookie(event.cookies),
      },
      redirect: 'manual',
    },
  );

  const headers = new Headers();
  const location = response.headers.get('location');
  if (location) headers.set('location', location);

  return new Response(undefined, {
    status: response.status,
    headers,
  });
};
