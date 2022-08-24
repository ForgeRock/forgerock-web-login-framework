import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { AM_DOMAIN_PATH, JSON_REALM_PATH } from '$lib/constants';
import { get as getCookie, remove as removeCookie } from '$lib/server/sessions';

export const POST: RequestHandler = async (event: RequestEvent) => {
  const cookie = event.request.headers.get('cookie');
  const reqCookieUuid = cookie && cookie.match(/=(\S{1,})/);
  const reqCookie = Array.isArray(reqCookieUuid) && getCookie(reqCookieUuid[1]);
  Array.isArray(reqCookieUuid) && removeCookie(reqCookieUuid[1]);

  const response = await fetch(`${AM_DOMAIN_PATH}${JSON_REALM_PATH}/sessions/${event.url.search}`, {
    method: 'POST',
    headers: {
      cookie: reqCookie ? reqCookie : '',
    },
  });

  const resBody = await response.text();
  // console.log(response);

  const headers = new Headers();
  headers.append('set-cookie', '');

  return new Response(resBody, { headers });
};
