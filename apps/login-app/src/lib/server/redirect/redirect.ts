/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { z } from 'zod';

import { env } from '$env/dynamic/private';
import { AM_DOMAIN_PATH } from '$core/constants';

import {
  resolveAgainstOrigin,
  isDefaultPath,
  isSamlURL,
  getRedirectUrlBasedOnRole,
  parseRedirectForm,
} from '../_utilities';
import {
  getHttpCookie,
  getUserRolesFromSession,
  removeHttpCookie,
  setHttpCookie,
  amFetchRequest,
} from '../sessions';

const REDIRECT_QUERY_PARAMS = 'redirect_query_params';

type RedirectParams = {
  goto?: string;
  gotoOnFail?: string;
};

/**
 * @function storeRedirectParams - stores redirect parameters from the request's query string into a cookie
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {RedirectParams} The extracted redirect parameters
 */
export function storeRedirectParams(event: RequestEvent): RedirectParams {
  const goto = event.url.searchParams.get('goto') || undefined;
  const gotoOnFail = event.url.searchParams.get('gotoOnFail') || undefined;

  if (goto || gotoOnFail) {
    setHttpCookie(
      event,
      REDIRECT_QUERY_PARAMS,
      JSON.stringify({
        ...(goto ? { goto } : {}),
        ...(gotoOnFail ? { gotoOnFail } : {}),
      }),
    );
  }

  return { goto, gotoOnFail };
}

/**
 * @function handleRedirectAction - handles the redirect action after authentication, determining the correct redirect URL (always throws a redirect)
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {Promise<never>} Never returns; always throws a redirect
 */
export async function handleRedirectAction(event: RequestEvent): Promise<never> {
  const { loginResult, tokenId, journeyStepUrl } = parseRedirectForm(
    await event.request.formData(),
  );
  const cookie = readAndClearRedirectCookie(event);

  const isGotoOnFail = loginResult !== 'success';

  const gotoUrl = isGotoOnFail ? cookie.gotoOnFail ?? '' : cookie.goto ?? journeyStepUrl;
  const amOrigin = new URL(AM_DOMAIN_PATH).origin;

  let successUrl: string | null = null;
  if (tokenId && gotoUrl) {
    successUrl = await validateUrl(tokenId, gotoUrl, amOrigin);
  }

  if (successUrl && !isDefaultPath(successUrl)) {
    throw redirect(303, successUrl);
  }

  if (successUrl && isDefaultPath(successUrl)) {
    if (isGotoOnFail) {
      successUrl = null; // treat as unusable
    } else if (journeyStepUrl && !isDefaultPath(journeyStepUrl)) {
      throw redirect(303, resolveAgainstOrigin(journeyStepUrl, amOrigin));
    } else if (isSamlURL(gotoUrl)) {
      throw redirect(303, resolveAgainstOrigin(gotoUrl, amOrigin));
    }
  }

  // If validateGoto was not usable, fall back to journeyStepUrl (if present).
  if (journeyStepUrl) {
    throw redirect(303, resolveAgainstOrigin(journeyStepUrl, amOrigin));
  }

  // Success flow: compute role-based default using the session token.
  if (!isGotoOnFail && tokenId) {
    const roles = await getUserRolesFromSession(tokenId);
    throw redirect(303, getRedirectUrlBasedOnRole(amOrigin, roles, env.FR_REALM_PATH));
  }

  // Final fallbacks.
  if (isGotoOnFail) {
    throw redirect(303, '/failure-redirect');
  }
  throw redirect(303, '/success-redirect');
}

/**
 * @function readAndClearRedirectCookie - reads and clears the redirect cookie to avoid state redirects
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {RedirectParams} The parsed cookie value
 */
function readAndClearRedirectCookie(event: RequestEvent): RedirectParams {
  const cookieValue = getHttpCookie(event, REDIRECT_QUERY_PARAMS);
  removeHttpCookie(event, REDIRECT_QUERY_PARAMS);

  const cookieSchema = z.object({
    goto: z.string().optional(),
    gotoOnFail: z.string().optional(),
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
 * @param {string} amOrigin - The AM server origin
 * @returns {Promise<string|null>} The validated URL or null if invalid
 */
async function validateUrl(
  tokenId: string,
  gotoUrl: string,
  amOrigin: string,
): Promise<string | null> {
  const response = await amFetchRequest(tokenId, '/users?_action=validateGoto', 'POST', {
    goto: gotoUrl,
  });
  const parsed = z.object({ successURL: z.string().optional() }).safeParse(response);
  if (
    !parsed.success ||
    !parsed.data.successURL ||
    parsed.data.successURL === 'undefined' ||
    parsed.data.successURL === 'null'
  ) {
    return null;
  }
  // AM may return relative URLs.
  const successURL = parsed.data.successURL;
  return resolveAgainstOrigin(successURL, amOrigin);
}
