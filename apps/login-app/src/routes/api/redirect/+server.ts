/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

// Reference: https://docs.pingidentity.com/pingoneaic/am-authentication/redirection-url-precedence.html

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { AM_DOMAIN_PATH, JSON_REALM_PATH } from '$core/constants';
import { REDIRECT_FALLBACK, REDIRECT_QUERY_PARAMS } from '$lib/redirect.constants';

async function validateGoto(
  fetchFn: typeof fetch,
  authorization: string,
  gotoUri: string,
): Promise<string | null> {
  const response = await fetchFn(`${AM_DOMAIN_PATH}${JSON_REALM_PATH}/users?_action=validateGoto`, {
    method: 'POST',
    headers: {
      'Accept-API-Version': 'protocol=2.1,resource=3.0',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: JSON.stringify({ goto: gotoUri }),
  });

  if (!response.ok) {
    console.warn('validateGoto failed', {
      status: response.status,
      statusText: response.statusText,
      hasAuthorization: authorization.toLowerCase().startsWith('bearer '),
    });
    return null;
  }

  // AM returns { successURL: string } even when the input goto is invalid
  // It falls back to the default success URL
  try {
    const bodyText = await response.text();
    const data = JSON.parse(bodyText) as { successURL?: string };
    if (!data?.successURL) return null;

    // successURL may be absolute or relative (e.g. '/enduser/?realm=/alpha').
    // Resolve relative URLs against the AM base URL.
    return new URL(data.successURL, AM_DOMAIN_PATH).href;
  } catch {
    return null;
  }
}

export const GET: RequestHandler = async ({ cookies, url, request, fetch }) => {
  const redirectUri = cookies.get(REDIRECT_QUERY_PARAMS);

  const authorization = request.headers.get('authorization') || '';

  if (!redirectUri) {
    return json({ redirectUri: REDIRECT_FALLBACK }, { status: 400 });
  }

  if (!authorization) {
    return json({ redirectUri: REDIRECT_FALLBACK }, { status: 401 });
  }

  // Cookie value is expected to be an absolute URL (normalized at write time)
  const validated = await validateGoto(fetch, authorization, redirectUri);

  // Clear cookie after successful validation
  if (validated) {
    cookies.delete(REDIRECT_QUERY_PARAMS, {
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      path: '/',
    });
  }

  return json({ redirectUri: validated ?? REDIRECT_FALLBACK }, { status: validated ? 200 : 400 });
};
