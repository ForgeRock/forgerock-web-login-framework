/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import { AM_COOKIE_NAME, AM_DOMAIN_PATH, JSON_REALM_PATH } from '$core/constants';

import type { Cookies } from '@sveltejs/kit';

import type { TokenId } from '$server/schemas';

const AM_TIMEOUT_MS = 2000;

/**
 * Builds the AM session cookie header from the browser-owned cookie.
 * The app must not keep an in-memory copy: requests can reach any replica.
 */
export function getAmCookie(cookies: Cookies): string {
  const value = cookies.get(AM_COOKIE_NAME);
  return value ? `${AM_COOKIE_NAME}=${value}` : '';
}

/**
 * Stores the AM session cookie as a host-only application cookie.
 * Do not copy the upstream Domain attribute to a tenant's browser.
 */
export function setAmCookie(cookies: Cookies, setCookie: string): void {
  const prefix = `${AM_COOKIE_NAME}=`;
  const cookiePart = setCookie
    .split(/,(?=[^;=,\s]+=[^;]+)/)
    .map((part) => part.trim().split(';')[0])
    .find((part) => part?.startsWith(prefix));
  if (!cookiePart) return;
  const value = cookiePart.slice(prefix.length);
  if (!value) {
    clearAmCookie(cookies);
    return;
  }

  cookies.set(AM_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  });
}

export function clearAmCookie(cookies: Cookies): void {
  cookies.delete(AM_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  });
}

export function resolveUpstreamQuery(url: URL): string {
  const params = new URLSearchParams(url.searchParams);
  params.delete('realm');
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * @function setHttpCookie - stores an HTTP cookie using the provided SvelteKit Cookies API.
 * @param {Cookies} cookies - SvelteKit Cookies API instance.
 * @param {string} name - The name of the cookie to set.
 * @param {string} value - The value to store in the cookie.
 * @returns {void}
 */
export function setHttpCookie(cookies: Cookies, name: string, value: string): void {
  cookies.set(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 300,
    path: '/',
  });
}

/**
 * @function getHttpCookie - retrieves an HTTP cookie value using the provided SvelteKit Cookies API.
 * @param {Cookies} cookies - SvelteKit Cookies API instance.
 * @param {string} name - The name of the cookie to read.
 * @returns {string | undefined} The cookie value if present, otherwise `undefined`.
 */
export function getHttpCookie(cookies: Cookies, name: string): string | undefined {
  return cookies.get(name);
}

/**
 * @function removeHttpCookie - deletes an HTTP cookie using the provided SvelteKit Cookies API.
 * @param {Cookies} cookies - SvelteKit Cookies API instance.
 * @param {string} name - The name of the cookie to delete.
 * @returns {void}
 */
export function removeHttpCookie(cookies: Cookies, name: string): void {
  cookies.delete(name, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 300,
    path: '/',
  });
}

/**
 * @function resolveJsonRealmPath - builds the AM JSON realm path segment for a given realm override.
 * @param {string} [realm] - Realm override; uses the configured JSON_REALM_PATH when omitted.
 * @returns {string} The AM JSON realm path (e.g. '/json/realms/root/realms/alpha').
 */
const VALID_REALM = /^[A-Za-z0-9_-]+$/;

export function resolveJsonRealmPath(realm?: string): string {
  if (realm === undefined) return JSON_REALM_PATH;

  const normalizedRealm = realm.replace(/^\/+/, '');
  if (!normalizedRealm || normalizedRealm === 'root') {
    return '/json/realms/root';
  }
  if (!VALID_REALM.test(normalizedRealm)) {
    return JSON_REALM_PATH;
  }

  return `/json/realms/root/realms/${normalizedRealm}`;
}

export function resolveOAuthRealmPath(realm?: string): string {
  const jsonRealmPath = resolveJsonRealmPath(realm);
  return jsonRealmPath.replace('/json/', '/oauth2/');
}

/**
 * @function getUserRolesFromSession - retrieves the user's roles from the AM backend using their session token
 * @param {string} tokenId - The session token ID
 * @param {string} realm - The realm the user authenticated in (e.g. 'alpha', 'root')
 * @returns {Promise<string[]>} An array of user roles or an empty roles array
 */
export async function getUserRolesFromSession(tokenId: TokenId, realm?: string): Promise<string[]> {
  const userId = await getUserIdFromSession(tokenId, realm);
  if (!userId) {
    return [];
  }
  const response = await amFetchRequest(
    tokenId,
    `/users/${encodeURIComponent(userId)}`,
    'GET',
    undefined,
    realm,
  );
  const parsed = z.object({ roles: z.array(z.string()) }).safeParse(response);
  return parsed.success ? parsed.data.roles : [];
}

/**
 * @function getUserIdFromSession - retrieves the user ID associated with a session token
 * @param {string} tokenId - The session token ID
 * @param {string} realm - The realm the user authenticated in (e.g. 'alpha', 'root')
 * @returns {Promise<string|null>} The user ID or null if not found
 */
export async function getUserIdFromSession(
  tokenId: TokenId,
  realm?: string,
): Promise<string | null> {
  // AIC blocks /users?_action=idFromSession (403). Use sessions validate instead,
  // which returns uid = the username string on AIC.
  const realmPath = resolveJsonRealmPath(realm);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AM_TIMEOUT_MS);
  try {
    const response = await fetch(`${AM_DOMAIN_PATH}${realmPath}/sessions?_action=validate`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Accept-API-Version': 'protocol=1.0,resource=2.0',
        'Content-Type': 'application/json',
        cookie: `${AM_COOKIE_NAME}=${tokenId}`,
      },
      body: JSON.stringify({ tokenId }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const parsed = z.object({ valid: z.boolean(), uid: z.string().optional() }).safeParse(data);
    return parsed.success && parsed.data.valid ? parsed.data.uid ?? null : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @function amFetchRequest - perform an authenticated request against the ForgeRock AM JSON API using a session token.
 * @param {string} tokenId - AM session token value to be included in the cookie header.
 * @param {string} endpoint - The AM API endpoint path
 * @param {string} method - HTTP method to use (e.g., 'GET', 'POST').
 * @param {object} [body] - Optional request body which will be JSON-stringified when provided.
 * @param {string} [realm] - Optional realm override; uses the configured JSON_REALM_PATH when omitted.
 * @returns {Promise<unknown|null>} Parsed JSON response on success, otherwise `null`.
 */
export async function amFetchRequest(
  tokenId: TokenId,
  endpoint: string,
  method: string,
  body?: object,
  realm?: string,
): Promise<unknown> {
  const realmPath = resolveJsonRealmPath(realm);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AM_TIMEOUT_MS);
  try {
    const response = await fetch(`${AM_DOMAIN_PATH}${realmPath}${endpoint}`, {
      method,
      headers: {
        accept: 'application/json',
        'Accept-API-Version': 'protocol=2.1,resource=3.0',
        'Content-Type': 'application/json',
        cookie: `${AM_COOKIE_NAME}=${tokenId}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
