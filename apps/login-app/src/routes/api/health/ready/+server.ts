/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';
import { fetchAm } from '$server/sessions';

import type { RequestHandler } from './$types';

function discoveryUrl(): string | null {
  if (!env.FR_AM_WELLKNOWN_URL || !env.FR_AM_COOKIE_NAME || !env.FR_REALM_PATH) return null;
  if (!env.FR_AM_URL) return null;
  // A relative well-known URL is resolved against FR_AM_URL because the ready
  // probe runs inside the pod and fetches AM server-side, not in the browser.
  // A malformed URL is invalid configuration, which the probe reports as 503
  // rather than an unhandled 500.
  try {
    return new URL(env.FR_AM_WELLKNOWN_URL, env.FR_AM_URL).toString();
  } catch {
    return null;
  }
}

export const GET: RequestHandler = async () => {
  const url = discoveryUrl();
  if (!url) {
    return new Response(JSON.stringify({ status: 'not-ready' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  // fetchAm owns the 2s timeout, failure classification, and logging; the probe
  // only folds any upstream outcome (transport failure or non-OK status) into
  // its 503 not-ready answer. The body is never read.
  const response = await fetchAm(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });
  if (response.kind === 'failure' || !response.ok) {
    return new Response(JSON.stringify({ status: 'not-ready' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: 'ready' }), {
    headers: { 'content-type': 'application/json' },
  });
};
