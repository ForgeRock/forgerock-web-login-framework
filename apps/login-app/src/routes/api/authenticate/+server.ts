/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_DOMAIN_PATH } from '$core/constants';
import { getAmCookie, resolveJsonRealmPath, setAmCookie } from '$server/sessions';

import type { RequestEvent } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const realm = event.url.searchParams.get('realm') ?? undefined;
  const body = await event.request.text();
  const response = await fetch(
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

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) setAmCookie(event.cookies, setCookie);

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
};
