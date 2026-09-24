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
import { appInflightRequests, recordAppRequest, routeLabel } from '$server/metrics';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Health probes are counted by kubelet, not by the metrics registry: they
  // are per-replica liveness signals whose volume carries no product signal.
  if (event.url.pathname.startsWith('/api/health/')) {
    return resolve(event);
  }

  const route = routeLabel(event);
  const method = event.request.method;
  const start = performance.now();
  appInflightRequests.inc();
  try {
    const response = await resolve(event);
    recordAppRequest(route, method, response.status, (performance.now() - start) / 1000);
    return applySecurityHeaders(event, response);
  } catch (error) {
    // A thrown handler never produced a response; count it as a 500-class
    // request so crashes are visible in the request rate.
    recordAppRequest(route, method, 500, (performance.now() - start) / 1000);
    throw error;
  } finally {
    appInflightRequests.dec();
  }
};

function applySecurityHeaders(event: Parameters<Handle>[0]['event'], response: Response): Response {
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
}
