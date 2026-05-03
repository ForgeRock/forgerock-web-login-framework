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

import { AM_COOKIE_NAME, AM_DOMAIN_PATH, JSON_REALM_PATH } from '$core/constants';
import { get, set } from '$server/sessions';

function getJsonRealmPath(event: RequestEvent): string {
  const referer = event.request.headers.get('referer');
  const refererUrl = referer ? new URL(referer) : null;
  const realmParam = event.url.searchParams.get('realm') ?? refererUrl?.searchParams.get('realm');

  if (realmParam == null) {
    return JSON_REALM_PATH;
  }

  const stripped = realmParam.replace(/^\/+/, '');
  return stripped ? `/json/realms/root/realms/${stripped}` : '/json/realms/root';
}

export const POST: RequestHandler = async (event: RequestEvent) => {
  const body = await event.request.text();
  let cookieUuid = '';
  const jsonRealmPath = getJsonRealmPath(event);

  // console.log(body.toString());

  // STATEFUL COOKIES
  const cookie = event.request.headers.get('cookie');
  const reqCookieUuid = cookie && cookie.match(/=(\S{1,})/);
  const reqCookie = Array.isArray(reqCookieUuid) && get(reqCookieUuid[1]);

  // STATELESS COOKIES
  // TODO: Implement stateless cookie management
  // console.log(`Cookie sent to AM: ${reqCookie}`);

  const response = await fetch(
    `${AM_DOMAIN_PATH}${jsonRealmPath}/authenticate?authIndexType=service&authIndexValue=Login`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-api-version': 'protocol=1.0,resource=2.1',
        'content-type': 'application/json',
        cookie: reqCookie ? reqCookie : '',
      },
      body,
    },
  );

  const resBody = await response.text();

  // console.log('Body of response from authenticate call:');
  // console.log(resBody);

  const resCookie = response.headers.get('set-cookie');
  // console.log(`AM response write cookie header: ${resCookie}`);

  if (resCookie?.includes(AM_COOKIE_NAME)) {
    if (resCookie !== reqCookie) {
      cookieUuid = set(resCookie);
    }
  }

  const headers = new Headers();
  headers.append(
    'set-cookie',
    cookieUuid
      ? `cookie=${cookieUuid}; domain=.crbrl.ngrok.io; SameSite=None; HTTPOnly; Secure;`
      : '',
  );

  return new Response(resBody, { headers });
};
