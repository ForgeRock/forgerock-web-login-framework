import type { RequestEvent } from '@sveltejs/kit';

import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from '$lib/constants';

export async function POST(event: RequestEvent) {
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
