import type { RequestEvent } from '@sveltejs/kit';

import { AM_DOMAIN_PATH, JSON_REALM_PATH } from '$lib/constants';
import { get as getCookie, remove as removeCookie } from '$lib/server/sessions';

export async function POST(event: RequestEvent) {
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

  // const resBody = await response.json();
  // console.log(response);

  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
  return {
    status: 200,
    body: response.body,
    headers: {
      'set-cookie': '',
    },
  };
}
