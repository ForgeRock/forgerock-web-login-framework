import type { RequestEvent } from '@sveltejs/kit';

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$lib/constants';

export async function GET(event: RequestEvent) {
  const response = await fetch(
    `${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/connect/endSession${event.url.search}`,
    {
      method: 'GET',
      headers: {
        authorization: event.request.headers.get('authorization') || '',
      },
    },
  );

  // const resBody = await response.json();
  // console.log(response);

  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
  // Suggestion (check for correctness before using):
  // return new Response(response.body);
  return {
    status: 200,
    body: response.body,
  };
}
