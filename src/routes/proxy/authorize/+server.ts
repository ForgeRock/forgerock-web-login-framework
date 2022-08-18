import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$lib/constants';
import { get as getCookie } from '$lib/server/sessions';

export const GET: RequestHandler = async (event: RequestEvent) => {
  // console.log('Start authorization call');
  const cookie = event.request.headers.get('cookie');
  const reqCookieUuid = cookie && cookie.match(/=(\S{1,})/);
  const reqCookie = Array.isArray(reqCookieUuid) && getCookie(reqCookieUuid[1]);

  // console.log('Authorize request: AM cookie sent');
  // console.log(reqCookie);

  const response = await fetch(
    `${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/authorize${event.url.search}`,
    {
      method: 'GET',
      headers: {
        cookie: reqCookie ? reqCookie : '',
      },
    },
  );

  // console.log(response.url);
  // console.log(await response.text());

  const headers = new Headers();
  headers.append('location', response.url)

  return new Response(undefined, {
    status: 302,
    headers,
  });
};
