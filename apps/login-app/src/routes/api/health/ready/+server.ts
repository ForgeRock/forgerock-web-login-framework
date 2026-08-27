/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';

import type { RequestHandler } from './$types';

const AM_TIMEOUT_MS = 2000;

function discoveryUrl(): string | null {
  if (!env.FR_AM_URL || !env.FR_AM_COOKIE_NAME || !env.FR_REALM_PATH) return null;

  const realmPath = env.FR_REALM_PATH === 'root' ? '' : `/realms/${env.FR_REALM_PATH}`;
  return `${env.FR_AM_URL}/oauth2/realms/root${realmPath}/.well-known/openid-configuration`;
}

export const GET: RequestHandler = async () => {
  const url = discoveryUrl();
  if (!url) {
    return new Response(JSON.stringify({ status: 'not-ready' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ status: 'not-ready' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ status: 'ready' }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ status: 'not-ready' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  } finally {
    clearTimeout(timeout);
  }
};
