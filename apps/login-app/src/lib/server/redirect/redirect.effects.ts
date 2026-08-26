/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import { AM_DOMAIN_PATH } from '$core/constants';
import { env } from '$env/dynamic/private';
import {
  amFetchRequest,
  getHttpCookie,
  getUserRolesFromSession,
  removeHttpCookie,
  setHttpCookie,
} from '$server/sessions';
import { parseRedirectForm } from './redirect.utilities';

import type { RequestEvent } from '@sveltejs/kit';

import type { RedirectData, RedirectParams } from './redirect.types';
import type { TokenId } from '$server/schemas';

const REDIRECT_QUERY_PARAMS = 'redirect_query_params';

// Realm names are used to build AM API paths directly (see sessions.ts), so only a
// single safe path segment is allowed — this also blocks path traversal via `../`.
const VALID_REALM = /^[A-Za-z0-9_-]+$/;

/**
 * @function resolveRealmFromUrl - Resolves the realm from a `?realm=` query param, falling back to the configured default realm when absent or invalid.
 * @param {URL} url - The request URL.
 * @returns {string} The resolved realm name.
 */
export function resolveRealmFromUrl(url: URL): string {
  const realmParam = url.searchParams.get('realm');
  if (realmParam != null) {
    const realm = realmParam.replace(/^\/+/, '');
    if (!realm) return 'root';
    return VALID_REALM.test(realm) ? realm : env.FR_REALM_PATH || 'root';
  }
  return env.FR_REALM_PATH || 'root';
}

/**
 * @function storeRedirectParams - stores redirect parameters from the request's query string into a cookie
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {RedirectParams} The extracted redirect parameters
 */
export function storeRedirectParams(event: RequestEvent): RedirectParams {
  const goto = event.url.searchParams.get('goto') || undefined;
  const gotoOnFail = event.url.searchParams.get('gotoOnFail') || undefined;
  const realm = resolveRealmFromUrl(event.url);

  setHttpCookie(
    event.cookies,
    REDIRECT_QUERY_PARAMS,
    JSON.stringify({
      ...(goto ? { goto } : {}),
      ...(gotoOnFail ? { gotoOnFail } : {}),
      realm,
    }),
  );

  return { goto, gotoOnFail, realm };
}

/**
 * @function createRedirectContext - Builds the redirect context from the request event, parsing form and cookie data and validating the redirect URL.
 * @param {FormData} formData - The submitted redirect form data.
 * @param {RedirectParams} cookie - Parsed redirect cookie values.
 * @returns {Promise<RedirectData>} The constructed redirect context.
 */
export async function createRedirectContext(
  formData: FormData,
  cookie: RedirectParams,
): Promise<RedirectData> {
  const { loginResult, tokenId, journeyStepUrl } = parseRedirectForm(formData);

  const isGotoOnFail = loginResult !== 'success';
  const gotoUrl = isGotoOnFail ? cookie.gotoOnFail ?? '' : cookie.goto ?? journeyStepUrl;
  const successUrl = tokenId && gotoUrl ? await validateUrl(tokenId, gotoUrl) : null;
  const realm = cookie.realm ?? env.FR_REALM_PATH ?? 'root';
  const roles = tokenId ? await getUserRolesFromSession(tokenId, realm) : [];
  const amOrigin = new URL(AM_DOMAIN_PATH).origin;

  return {
    tokenId,
    journeyStepUrl,
    isGotoOnFail,
    gotoUrl,
    successUrl,
    roles,
    realm,
    amOrigin,
  };
}

/**
 * @function readAndClearRedirectCookie - reads and clears the redirect cookie to avoid stale redirects
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {RedirectParams} The parsed cookie value
 */
export function readAndClearRedirectCookie(event: RequestEvent): RedirectParams {
  const cookieValue = getHttpCookie(event.cookies, REDIRECT_QUERY_PARAMS);
  removeHttpCookie(event.cookies, REDIRECT_QUERY_PARAMS);

  const cookieSchema = z.object({
    goto: z.string().optional(),
    gotoOnFail: z.string().optional(),
    realm: z.string().optional(),
  });

  if (!cookieValue) {
    return {};
  }

  try {
    const parsed = cookieSchema.safeParse(JSON.parse(cookieValue));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/**
 * @function validateUrl - validates a redirect URL with the AM backend and returns a success URL if valid
 * @param {string} tokenId - The session token ID
 * @param {string} gotoUrl - The URL to validate
 * @returns {Promise<string|null>} The validated URL or null if invalid
 */
export async function validateUrl(tokenId: TokenId, gotoUrl: string): Promise<string | null> {
  const response = await amFetchRequest(tokenId, '/users?_action=validateGoto', 'POST', {
    goto: gotoUrl,
  });
  const parsed = z.object({ successUrl: z.string().optional() }).safeParse(response);
  if (
    !parsed.success ||
    !parsed.data.successUrl ||
    parsed.data.successUrl === 'undefined' ||
    parsed.data.successUrl === 'null'
  ) {
    return null;
  }
  return parsed.data.successUrl;
}
