import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$lib/constants';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const response = await fetch(
    `${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/connect/endSession${event.url.search}`,
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
