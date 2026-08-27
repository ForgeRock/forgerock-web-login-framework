/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';
import { buildLoginCspHeaders, isHtmlResponse } from '$server/csp.utilities';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  if (!isHtmlResponse(response)) {
    return response;
  }

  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Referrer-Policy', 'origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  const cspHeaders = buildLoginCspHeaders(
    event.url,
    {
      enforced: env.CSP_ENFORCED,
      reportOnly: env.CSP_REPORT_ONLY,
    },
    {
      amUrl: env.FR_AM_URL,
      currentHost: event.request.headers.get('host'),
      configuredRealm: env.FR_REALM_PATH,
    },
  );

  cspHeaders.forEach((value, header) => {
    response.headers.set(header, value);
  });

  return response;
};
