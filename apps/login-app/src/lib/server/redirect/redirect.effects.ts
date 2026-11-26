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
 * @returns {Promise<RedirectData>} The constructed redirect context.
 */
export async function createRedirectContext(
  formData: FormData,
  cookie: RedirectParams,
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
  const validatedUrl = gotoUrl ? await validateGoto(tokenId, gotoUrl, realm) : null;
  const roles = tokenId ? (await getUserRolesFromSession(tokenId, realm)).roles : [];
  const amOrigin = new URL(AM_DOMAIN_PATH).origin;

  return {
    tokenId,
    journeyStepUrl,
    isGotoOnFail,
    gotoUrl,
    validatedUrl,
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
 * @function validateGoto - validates a redirect URL with the AM backend and returns the validated URL
 *
 * AM returns the key as `successURL` (capital URL) — verified against the
 * tenant; parsing lowercase was why this always returned null.
 *
 * @param {string} tokenId - The session token ID
 * @param {string} gotoUrl - The URL to validate
 * @param {string} [realm] - The realm to validate against; uses the configured realm when omitted.
 * @returns {Promise<string|null>} AM's validated URL, or null when AM returns no usable answer
 */
export async function validateGoto(
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
    log.warn('[redirect] goto validation returned no usable validatedUrl', {
      goto: describeRedirectTarget(gotoUrl),
      realm,
    });
    return null;
  }
  return parsed.data.successURL;
}
