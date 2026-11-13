/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import { env } from '$env/dynamic/private';
import { AM_DOMAIN_PATH } from '$server/constants';
import { log } from '$server/logger.effects';
import {
  amFetchRequest,
  fetchAm,
  getHttpCookie,
  getUserRolesFromSession,
  removeHttpCookie,
  setHttpCookie,
} from '$server/sessions';
import {
  describeRedirectTarget,
  normalizeRealm,
  parseRedirectForm,
  resolveRequestedRealm,
} from './redirect.utilities';

import type { RequestEvent } from '@sveltejs/kit';

import type { RedirectData, RedirectParams } from './redirect.types';
import type { TokenId } from '$server/schemas';

const REDIRECT_QUERY_PARAMS = 'redirect_query_params';

/**
 * @function storeRedirectParams - stores redirect parameters from the request's query string into a cookie
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {RedirectParams} The extracted redirect parameters
 */
export function storeRedirectParams(event: RequestEvent): RedirectParams {
  const goto = event.url.searchParams.get('goto') || undefined;
  const gotoOnFail = event.url.searchParams.get('gotoOnFail') || undefined;
  const realm = resolveRequestedRealm(event.url, env.FR_REALM_PATH);

  if (!goto && !gotoOnFail) {
    return { goto, gotoOnFail, realm };
  }

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
 * @param {string} arrivalOrigin - The origin the user arrived on (event.url.origin).
 * @returns {Promise<RedirectData>} The constructed redirect context.
 */
export async function createRedirectContext(
  formData: FormData,
  cookie: RedirectParams,
  arrivalOrigin: string,
): Promise<RedirectData> {
  const { loginResult, tokenId, journeyStepUrl, realm: formRealm } = parseRedirectForm(formData);
  const isGotoOnFail = loginResult !== 'success';
  const gotoUrl = isGotoOnFail ? cookie.gotoOnFail ?? '' : cookie.goto ?? journeyStepUrl;
  /**
   * formRealm here represents the realm that the DOM in page.svelte file holds.
   * The realm must be stored somewhere (query param ?? env), but the cookie is
   * only written when goto/gotoOnFail query params exist
   * We check if formRealm exists, if not, we use the realm from cookie or env
   */
  const realm = formRealm ?? cookie.realm ?? normalizeRealm(env.FR_REALM_PATH);
  const successUrl = gotoUrl ? await validateUrl(tokenId, gotoUrl, realm) : null;
  const roles = tokenId ? (await getUserRolesFromSession(tokenId, realm)).roles : [];
  const amOrigin = await resolveRedirectOrigin(arrivalOrigin, realm);

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
 * @function resolveRedirectOrigin - Resolves the origin post-login redirects should target: the arrival origin when the user arrived on an AM-served host, otherwise the configured AM origin.
 *   arrivalOrigin = 'https://id.petrov.ca',   realm = 'alpha', serverinfo /alpha → returns 'https://id.petrov.ca'
 *   arrivalOrigin = 'https://app.example.com', realm = 'alpha', serverinfo 404   → returns the configured AM origin
 * @param {string} arrivalOrigin - The origin the user arrived on (event.url.origin).
 * @param {string} realm - The requested realm.
 * @returns {Promise<string>} The origin post-login redirects should target.
 */
export async function resolveRedirectOrigin(arrivalOrigin: string, realm: string): Promise<string> {
  const amOrigin = new URL(AM_DOMAIN_PATH).origin;
  if (new URL(arrivalOrigin).host === new URL(amOrigin).host) {
    return amOrigin;
  }
  try {
    const amBasePath = new URL(AM_DOMAIN_PATH).pathname.replace(/\/+$/, '');
    const upstream = await fetchAm(new URL(`${amBasePath}/json/serverinfo/*`, arrivalOrigin).href, {
      headers: { accept: 'application/json' },
    });
    if (upstream.kind === 'response') {
      try {
        const body = JSON.parse(upstream.body ?? '') as { realm?: unknown };
        if (typeof body.realm === 'string' && normalizeRealm(body.realm) === realm) {
          return arrivalOrigin;
        }
      } catch {
        // Body isn't JSON (e.g. a 404 HTML page) — not an AM-served host.
      }
    }
  } catch {
    // Transport failure — not an AM-served host.
  }
  return amOrigin;
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
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // Unparseable JSON takes the same warning path as a schema mismatch.
  }
  log.warn('[redirect] ignoring malformed redirect cookie');
  return {};
}

/**
 * @function validateUrl - validates a redirect URL with the AM backend and returns a success URL if valid
 *
 * AM returns the key as `successURL` (capital URL) — verified against the
 * tenant; parsing lowercase was why this always returned null.
 *
 * @param {string} tokenId - The session token ID
 * @param {string} gotoUrl - The URL to validate
 * @param {string} [realm] - The realm to validate against; uses the configured realm when omitted.
 * @returns {Promise<string|null>} The validated URL or null if invalid
 */
export async function validateUrl(
  tokenId: TokenId,
  gotoUrl: string,
  realm?: string,
): Promise<string | null> {
  const response = await amFetchRequest(
    tokenId,
    '/users?_action=validateGoto',
    'POST',
    {
      goto: gotoUrl,
    },
    realm,
  );
  const parsed = z.object({ successURL: z.string().optional() }).safeParse(response);
  if (
    !parsed.success ||
    !parsed.data.successURL ||
    parsed.data.successURL === 'undefined' ||
    parsed.data.successURL === 'null'
  ) {
    log.warn('[redirect] goto validation returned no usable successUrl', {
      goto: describeRedirectTarget(gotoUrl),
      realm,
    });
    return null;
  }
  return parsed.data.successURL;
}
