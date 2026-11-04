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
import { log } from '$server/logger.effects';

import type { Cookies } from '@sveltejs/kit';

import type { TokenId } from '$server/schemas';

const AM_TIMEOUT_MS = 2000;

/** AM answered completely: headers captured, body already consumed. */
export interface AmUpstreamResponse {
  readonly kind: 'response';
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly body: string;
}

/** Why the exchange failed: our timer fired, or the connection died first. */
export type AmUpstreamFailureReason = 'timeout' | 'network';

export interface AmUpstreamFailure {
  readonly kind: 'failure';
  readonly reason: AmUpstreamFailureReason;
  readonly error: Error;
}

export type AmUpstream = AmUpstreamResponse | AmUpstreamFailure;

/**
 * @function fetchAm - fetch against AM and read the full response under the
 * shared 2s timeout. The abort timer stays armed until the body is consumed,
 * so a stalled body (not just stalled headers) fails fast instead of pinning
 * the SvelteKit request open. Returns a buffered record rather than a Response
 * so callers cannot re-introduce an un-timed body read; intended for the AM
 * proxy's small JSON payloads, never for streaming downloads.
 *
 * Failures are encoded in the return type, never thrown: `reason: 'timeout'`
 * means this function's own signal aborted; `reason: 'network'` means DNS,
 * refused connection, TLS, or a mid-body reset. Any caller-provided
 * `init.signal` is ignored; this function owns the signal.
 * @param {string} url - The absolute AM endpoint URL.
 * @param {RequestInit} [init] - Standard fetch init; `signal` is supplied here.
 * @returns {Promise<AmUpstream>} The buffered upstream exchange or a classified failure.
 */
export async function fetchAm(url: string, init: RequestInit = {}): Promise<AmUpstream> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AM_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.text();
    return {
      kind: 'response',
      status: response.status,
      ok: response.ok,
      headers: new Headers(response.headers),
      body,
    };
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    // Classify by our own signal, not by error.name: every fetch implementation
    // surfaces abort differently (AbortError, TypeError "terminated" with an
    // AbortError cause), but signal.aborted is unambiguous and only this
    // function's timer can trip it.
    if (controller.signal.aborted) {
      log.warn('[sessions] AM upstream timed out', normalized);
      return { kind: 'failure', reason: 'timeout', error: normalized };
    }
    log.error('[sessions] AM upstream request failed', normalized);
    return { kind: 'failure', reason: 'network', error: normalized };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @function upstreamFailureResponse - folds a transport failure into the proxy's
 * error Response: 504 when this server's timeout fired, 502 when AM was
 * unreachable (DNS, refused connection, TLS). Pure; the failure was already
 * logged by `fetchAm`.
 * @param {AmUpstreamFailure} failure - The classified transport failure.
 * @returns {Response} A JSON error response carrying a content-type header.
 */
export function upstreamFailureResponse(failure: AmUpstreamFailure): Response {
  return new Response(
    JSON.stringify({
      error: failure.reason === 'timeout' ? 'upstream_timeout' : 'upstream_unavailable',
    }),
    {
      status: failure.reason === 'timeout' ? 504 : 502,
      headers: { 'content-type': 'application/json' },
    },
  );
}

/**
 * @function pickUpstreamHeaders - copies the named headers into a fresh Headers
 * instance for the proxied response. Pure.
 * @param {Headers} headers - The upstream response headers.
 * @param {readonly string[]} names - Header names to relay.
 * @returns {Headers} A new Headers instance with only the picked headers.
 */
export function pickUpstreamHeaders(headers: Headers, names: readonly string[]): Headers {
  const picked: [string, string][] = [];
  for (const name of names) {
    const value = headers.get(name);
    if (value) picked.push([name, value]);
  }
  return new Headers(picked);
}

/**
 * Builds the AM session cookie header from the browser-owned cookie.
 * Kept stateless, since requests can land on any replica.
 */
export function getAmCookie(cookies: Cookies): string {
  const value = cookies.get(AM_COOKIE_NAME);
  return value ? `${AM_COOKIE_NAME}=${value}` : '';
}

/**
 * Stores the AM session cookie as a host-only cookie, leaving out the upstream
 * Domain attribute so it stays scoped to the tenant's browser. Persistence
 * attributes (Max-Age, falling back to Expires per RFC 6265 section 4.1.2) are
 * forwarded so the browser retains the session for as long as AM intends;
 * malformed attributes fall back to a session cookie.
 */
export function setAmCookie(cookies: Cookies, setCookie: string): void {
  const prefix = `${AM_COOKIE_NAME}=`;
  const cookiePart = setCookie
    .split(/,(?=\s*[^;=,\s]+=[^;]+)/)
    .map((part) => part.trim())
    .find((part) => part?.startsWith(prefix));
  if (!cookiePart) return;

  const [pair, ...attributes] = cookiePart.split(';').map((attribute) => attribute.trim());
  const value = pair?.slice(prefix.length);
  if (!value) {
    clearAmCookie(cookies);
    return;
  }

  const parseDate = (raw: string | undefined): Date | undefined => {
    if (!raw) return undefined;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };
  const parseMaxAge = (raw: string | undefined): number | undefined => {
    if (!raw || !/^-?\d+$/.test(raw.trim())) return undefined;
    return Number(raw.trim());
  };

  const maxAge = parseMaxAge(
    attributes.find((attribute) => /^Max-Age\s*=/i.test(attribute))?.split('=')[1],
  );
  const expires = parseDate(
    attributes.find((attribute) => /^Expires\s*=/i.test(attribute))?.split('=')[1],
  );

  cookies.set(AM_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(expires !== undefined && maxAge === undefined ? { expires } : {}),
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

const VALID_REALM = /^[A-Za-z0-9_-]+$/;

/**
 * @function resolveJsonRealmPath - builds the AM JSON realm path segment for a given realm override.
 * @param {string} [realm] - Realm override; uses the configured JSON_REALM_PATH when omitted.
 * @returns {string} The AM JSON realm path (e.g. '/json/realms/root/realms/alpha').
 */
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
 * The outcome of reading an AM session. `unreachable` is true when AM could not be
 * reached (network error, timeout, or a non-OK AM response), so callers can report
 * an AM outage instead of treating it as an invalid session. When AM answers, `userId`
 * is the session's uid or null for an invalid or expired session, and `roles` carries
 * that user's AM roles (empty for an invalid session).
 */
export interface AmSession {
  readonly userId: string | null;
  readonly roles: ReadonlyArray<string>;
  readonly unreachable: boolean;
}

/**
 * @function getUserRolesFromSession - validates an AM session token and fetches that
 * user's roles, distinguishing "AM answered" from "AM could not be reached" so callers
 * can report AM outages instead of treating them as invalid sessions.
 * @param {string} tokenId - The session token ID
 * @param {string} [realm] - The realm the user authenticated in (e.g. 'alpha', 'root')
 * @returns {Promise<AmSession>} The session's user id, roles, and AM reachability.
 */
export async function getUserRolesFromSession(
  tokenId: TokenId,
  realm?: string,
): Promise<AmSession> {
  // AIC blocks /users?_action=idFromSession (403). Use sessions validate instead,
  // which returns uid = the username string on AIC.
  const response = await fetchAm(
    `${AM_DOMAIN_PATH}${resolveJsonRealmPath(realm)}/sessions?_action=validate`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Accept-API-Version': 'protocol=1.0,resource=2.0',
        'Content-Type': 'application/json',
        cookie: `${AM_COOKIE_NAME}=${tokenId}`,
      },
      body: JSON.stringify({ tokenId }),
    },
  );
  if (response.kind === 'failure') return { userId: null, roles: [], unreachable: true };
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { userId: null, roles: [], unreachable: false };
    }
    return { userId: null, roles: [], unreachable: true };
  }
  let userId: string | null = null;
  try {
    const parsed = z
      .object({ valid: z.boolean(), uid: z.string().optional() })
      .safeParse(JSON.parse(response.body) as unknown);
    if (parsed.success && parsed.data.valid) userId = parsed.data.uid ?? null;
  } catch {
    // AM answered 200 with a body we cannot read as JSON: report it as an AM
    // outage, the same treatment a transport failure gets, rather than as an
    // invalid session.
    return { userId: null, roles: [], unreachable: true };
  }
  if (userId === null) {
    return { userId: null, roles: [], unreachable: false };
  }
  const rolesResponse = await amFetchRequest(
    tokenId,
    `/users/${encodeURIComponent(userId)}`,
    'GET',
    undefined,
    realm,
  );
  const parsedRoles = z.object({ roles: z.array(z.string()) }).safeParse(rolesResponse);
  return {
    userId,
    roles: parsedRoles.success ? parsedRoles.data.roles : [],
    unreachable: false,
  };
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
  // AIC blocks the fully qualified root users collection, including actions.
  // Use its equivalent root action route only for redirect validation.
  const requestRealmPath =
    endpoint === '/users?_action=validateGoto' && realmPath === '/json/realms/root'
      ? '/json'
      : realmPath;
  const response = await fetchAm(`${AM_DOMAIN_PATH}${requestRealmPath}${endpoint}`, {
    method,
    headers: {
      accept: 'application/json',
      'Accept-API-Version': 'protocol=2.1,resource=3.0',
      'Content-Type': 'application/json',
      cookie: `${AM_COOKIE_NAME}=${tokenId}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.kind === 'failure' || !response.ok) return null;
  try {
    return JSON.parse(response.body) as unknown;
  } catch {
    return null;
  }
}
