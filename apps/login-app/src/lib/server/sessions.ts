/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { v4 as uuid } from 'uuid';
import { z } from 'zod';

import { AM_COOKIE_NAME, AM_DOMAIN_PATH, JSON_REALM_PATH } from '$core/constants';

import type { Cookies } from '@sveltejs/kit';

import type { TokenId } from '$server/schemas';

const amSessions: Map<string, string> = new Map();

/**
 * @function set - stores a cookie value in the in-memory session map and returns a generated UUID
 * @param {string} cookie - The cookie string to store
 * @returns {string} The generated UUID for the stored cookie
 */
export function set(cookie: string): string {
  const cookieUuid = uuid();
  amSessions.set(cookieUuid, cookie);
  return cookieUuid;
}

/**
 * @function get - retrieves a cookie value from the in-memory session map by UUID
 * @param {string} uuid - The UUID of the stored cookie
 * @returns {string} The cookie string, or an empty string if not found
 */
export function get(uuid: string): string {
  const cookie = amSessions.get(uuid) || '';
  return cookie;
}

/**
 * @function remove - deletes a cookie value from the in-memory session map by UUID
 * @param {string} uuid - The UUID of the stored cookie to remove
 * @returns {void}
 */
export function remove(uuid: string): void {
  amSessions.delete(uuid);
}

/**
 * @function setHttpCookie - stores an HTTP cookie using the provided SvelteKit Cookies API.
 * @param {Cookies} cookies - SvelteKit cookies API instance.
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
 * @param {Cookies} cookies - SvelteKit cookies API instance.
 * @param {string} name - The name of the cookie to read.
 * @returns {string | undefined} The cookie value if present, otherwise `undefined`.
 */
export function getHttpCookie(cookies: Cookies, name: string): string | undefined {
  return cookies.get(name);
}

/**
 * @function removeHttpCookie - deletes an HTTP cookie using the provided SvelteKit Cookies API.
 * @param {Cookies} cookies - SvelteKit cookies API instance.
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
 * @function getUserRolesFromSession - retrieves the user's roles from the AM backend using their session token
 * @param {string} tokenId - The session token ID
 * @returns {Promise<string[]>} An array of user roles or an empty roles array
 */
export async function getUserRolesFromSession(tokenId: TokenId): Promise<string[]> {
  const userId = await getUserIdFromSession(tokenId);
  if (!userId) {
    return [];
  }
  const response = await amFetchRequest(tokenId, `/users/${encodeURIComponent(userId)}`, 'GET');
  const parsed = z.object({ roles: z.array(z.string()) }).safeParse(response);
  return parsed.success ? parsed.data.roles : [];
}

/**
 * @function getUserIdFromSession - retrieves the user ID associated with a session token
 * @param {string} tokenId - The session token ID
 * @returns {Promise<string|null>} The user ID or null if not found
 */
export async function getUserIdFromSession(tokenId: TokenId): Promise<string | null> {
  const response = await amFetchRequest(tokenId, '/users?_action=idFromSession', 'POST', {});
  const parsed = z.object({ id: z.string() }).safeParse(response);
  return parsed.success ? parsed.data.id : null;
}

/**
 * @function amFetchRequest - perform an authenticated request against the ForgeRock AM JSON API using a session token.
 * @param {string} tokenId - AM session token value to be included in the cookie header.
 * @param {string} endpoint - The AM API endpoint path
 * @param {string} method - HTTP method to use (e.g., 'GET', 'POST').
 * @param {object} [body] - Optional request body which will be JSON-stringified when provided.
 * @returns {Promise<unknown|null>} Parsed JSON response on success, otherwise `null`.
 */
export async function amFetchRequest(
  tokenId: TokenId,
  endpoint: string,
  method: string,
  body?: object,
): Promise<unknown> {
  const response = await fetch(`${AM_DOMAIN_PATH}${JSON_REALM_PATH}${endpoint}`, {
    method: method,
    headers: {
      accept: 'application/json',
      'Accept-API-Version': 'protocol=2.1,resource=3.0',
      'Content-Type': 'application/json',
      cookie: `${AM_COOKIE_NAME}=${tokenId}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}
