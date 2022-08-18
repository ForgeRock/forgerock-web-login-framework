import { json as json$1 } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$lib/constants';

export async function GET(event: RequestEvent) {
  const response = await fetch(`${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/userinfo`, {
    method: 'POST',
    headers: {
      authorization: event.request.headers.get('authorization') || '',
    },
  });

  const resBody = await response.json();
  // console.log(resBody);

  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
  // Suggestion (check for correctness before using):
  // return json$1(resBody);
  return {
    status: 200,
    body: resBody,
  };
}
