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
import { env } from '$env/dynamic/private';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import type { RequestHandler } from './$types';

import { AM_DOMAIN_PATH, JSON_REALM_PATH, OAUTH_REALM_PATH } from '$core/constants';
import { REDIRECT_QUERY_PARAMS } from '$lib/redirect.utilities';

const am_origin = new URL(AM_DOMAIN_PATH).origin;
const AM_JWKS = createRemoteJWKSet(new URL(`${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/connect/jwk_uri`));

async function getDefaultRedirectUrl(authorization: string): Promise<string> {
  const realm = env.FR_REALM_PATH;
  const realmPath = realm && realm !== 'root' ? `/${realm}` : '/';

  const endUserUrl = `${am_origin}/enduser/?realm=${realmPath}#/`;
  const adminUrl = `${am_origin}/platform/?realm=${realmPath}`;

  // verify access token and retrieve user's uuid from access token
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1];
  if (!accessToken) return endUserUrl;
  let sub: string | null = null;
  try {
    const { payload } = await jwtVerify(accessToken, AM_JWKS);
    sub = typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    sub = null;
  }
  if (!sub) return endUserUrl;

  // retrieve user roles from /users endpoint
  const endpoint = `${AM_DOMAIN_PATH}${JSON_REALM_PATH}/users/${encodeURIComponent(sub)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'Accept-API-Version': 'protocol=2.1,resource=3.0',
      Authorization: authorization,
    },
  });
  if (!response.ok) return endUserUrl;

  let rolesArray: string[] = [];
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidate = record.roles ?? record.role ?? record.uiRoles ?? record.groups;
      if (Array.isArray(candidate)) {
        rolesArray = candidate.filter((item): item is string => typeof item === 'string');
      }
    }
  } catch {
    rolesArray = [];
  }

  const isAdmin = rolesArray.includes('ui-global-admin') || rolesArray.includes('ui-realm-admin');
  return isAdmin ? adminUrl : endUserUrl;
}

// isDefaultPath is looking for a path that looks like '/am/console' or '/auth/console'
function isDefaultPath(urlOrPath: string | null): boolean {
  const pathname = urlOrPath?.split('?')[0].split('#')[0];
  const lastSegment = pathname?.split('/').filter(Boolean).at(-1);
  return lastSegment === 'console';
}

function isSamlURL(urlOrPath: string): boolean {
  return urlOrPath.includes('/Consumer/metaAlias') || urlOrPath.includes('/saml2');
}

function parseCookie(cookieValue: string | undefined) {
  if (!cookieValue) return {};
  try {
    const parsed = z
      .object({ goto: z.string().nullish(), gotoOnFail: z.string().nullish() })
      .safeParse(JSON.parse(cookieValue));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

async function validateGoto(authorization: string, gotoUrl: string): Promise<string | null> {
  const response = await fetch(`${AM_DOMAIN_PATH}${JSON_REALM_PATH}/users?_action=validateGoto`, {
    method: 'POST',
    headers: {
      'Accept-API-Version': 'protocol=2.1,resource=3.0',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: JSON.stringify({ goto: gotoUrl }),
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
    const parsed = z.object({ successURL: z.string().optional() }).safeParse(await response.json());
    if (!parsed.success || !parsed.data.successURL) return null;

    // successURL may be absolute or relative (e.g. '/enduser/?realm=/alpha').
    // Resolve relative URLs against the AM base URL.
    return new URL(parsed.data.successURL, am_origin).href;
  } catch {
    return null;
  }
}

export const POST: RequestHandler = async ({ cookies, request, url }) => {
  const authorization = request.headers.get('authorization') || '';

  if (!authorization) {
    return json({ redirectUrl: '' }, { status: 401 });
  }

  let currentUrl = '';
  let isGotoOnFail = false;
  try {
    const parsed = z
      .object({ url: z.string().default(''), isGotoOnFail: z.boolean().default(false) })
      .safeParse(await request.json());
    if (parsed.success) ({ url: currentUrl, isGotoOnFail } = parsed.data);
  } catch {
    console.warn('POST /api/redirect: failed to parse request body');
  }

  const cookieValue = cookies.get(REDIRECT_QUERY_PARAMS);
  const cookie = parseCookie(cookieValue);

  // Clear cookie after read to avoid stale redirects
  cookies.delete(REDIRECT_QUERY_PARAMS, {
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    path: '/',
  });

  const gotoUrl = isGotoOnFail ? cookie.gotoOnFail || '' : cookie.goto || currentUrl;

  if (!gotoUrl) {
    const redirectUrl = await getDefaultRedirectUrl(authorization);
    return json({ redirectUrl }, { status: 200 });
  }

  const successURL = await validateGoto(authorization, gotoUrl);

  if (
    !isDefaultPath(successURL) &&
    successURL !== 'undefined' &&
    successURL !== null &&
    successURL !== 'null'
  ) {
    return json({ redirectUrl: successURL }, { status: 200 });
  }
  if (isDefaultPath(successURL) && isGotoOnFail) {
    return json({ redirectUrl: '' }, { status: 200 });
  }
  if (isDefaultPath(successURL) && !isDefaultPath(currentUrl)) {
    return json({ redirectUrl: currentUrl }, { status: 200 });
  }
  // example: successURL is '/am/console' and gotoUrl is 'https://default.iam.example.com/am/Consumer/metaAlias/avsp'
  if (isDefaultPath(successURL) && isSamlURL(gotoUrl)) {
    return json({ redirectUrl: gotoUrl }, { status: 200 });
  }

  const redirectUrl = await getDefaultRedirectUrl(authorization);
  return json({ redirectUrl }, { status: 200 });
};
