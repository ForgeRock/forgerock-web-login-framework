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

/**
 * Returns true if the URL is an AM OAuth2 authorize endpoint.
 * These URLs must never be used as a top-level redirect destination:
 * appAuthHelperRedirect.html (the OAuth redirect_uri) is designed to run
 * inside a hidden iframe and post tokens back to the parent SPA. If the
 * browser navigates there as the main frame, it gets stuck.
 */
function isOAuthAuthorizePath(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.includes('/oauth2/') && parsed.pathname.endsWith('/authorize');
  } catch {
    const pathname = url.split('?')[0].split('#')[0];
    return pathname.includes('/oauth2/') && pathname.endsWith('/authorize');
  }
}

/**
 * In this deployment /enduser/ and /login/ on the login-app host are routed
 * back to this login app by HAProxy (USE_NEW_LOGIN_APP=true). Redirecting there
 * would loop. Check both path AND host to avoid falsely flagging platform-ui URLs.
 */
function isLoginAppPath(url: string, loginAppOrigin: string): boolean {
  try {
    const parsed = new URL(url);
    const appHost = new URL(loginAppOrigin).host;
    if (parsed.host !== appHost) return false;
    return (
      parsed.pathname === '/enduser' ||
      parsed.pathname.startsWith('/enduser/') ||
      parsed.pathname === '/login' ||
      parsed.pathname.startsWith('/login/')
    );
  } catch {
    // Relative URL — check pathname only (relative URLs are always on the login-app host)
    const pathname = url.split('?')[0].split('#')[0];
    return (
      pathname === '/enduser' ||
      pathname.startsWith('/enduser/') ||
      pathname === '/login' ||
      pathname.startsWith('/login/')
    );
  }
}

type RedirectParams = {
  goto?: string;
  gotoOnFail?: string;
  realm?: string;
};

/**
 * @function storeRedirectParams - stores redirect parameters from the request's query string into a cookie
 * @param {RequestEvent} event - The SvelteKit request event
 * @returns {RedirectParams} The extracted redirect parameters
 */
export function storeRedirectParams(event: RequestEvent): RedirectParams {
  const goto = event.url.searchParams.get('goto') || undefined;
  const gotoOnFail = event.url.searchParams.get('gotoOnFail') || undefined;
  const realmParam = event.url.searchParams.get('realm');
  const realm = realmParam != null ? realmParam.replace(/^\/+/, '') || 'root' : 'root';

  setHttpCookie(
    event,
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

  // AM returns login-app paths (e.g. /enduser/?realm=/alpha) as the default
  // successURL — redirecting there would loop back into this app.
  if (successUrl && isLoginAppPath(successUrl, amOrigin)) {
    successUrl = null;
  }

  // OAuth authorize URLs (e.g. /am/oauth2/alpha/authorize?...) must not be used
  // as a top-level redirect. appAuthHelperRedirect.html only works inside a
  // hidden iframe. Redirect to the SPA instead and let it handle OAuth via its
  // own iframe mechanism.
  if (successUrl && isOAuthAuthorizePath(successUrl)) {
    successUrl = null;
  }

  if (successUrl && !isDefaultPath(successUrl)) {
    throw redirect(303, successUrl);
  }

  if (successUrl && isDefaultPath(successUrl)) {
    if (isGotoOnFail) {
      successUrl = null; // treat as unusable
    } else if (
      journeyStepUrl &&
      !isDefaultPath(journeyStepUrl) &&
      !isLoginAppPath(resolveAgainstOrigin(journeyStepUrl, amOrigin), amOrigin) &&
      !isOAuthAuthorizePath(journeyStepUrl)
    ) {
      throw redirect(303, resolveAgainstOrigin(journeyStepUrl, amOrigin));
    } else if (isSamlURL(gotoUrl)) {
      throw redirect(303, resolveAgainstOrigin(gotoUrl, amOrigin));
    }
  }

  // If validateGoto was not usable, fall back to journeyStepUrl (if present and not a login-app loop or OAuth flow).
  if (
    journeyStepUrl &&
    !isLoginAppPath(resolveAgainstOrigin(journeyStepUrl, amOrigin), amOrigin) &&
    !isOAuthAuthorizePath(journeyStepUrl)
  ) {
    throw redirect(303, resolveAgainstOrigin(journeyStepUrl, amOrigin));
  }

  // Success flow: compute role-based default using the session token.
  if (!isGotoOnFail && tokenId) {
    const roles = await getUserRolesFromSession(tokenId);
    const platformOrigin = env.FR_PLATFORM_ORIGIN || undefined;
    const destination = getRedirectUrlBasedOnRole(
      amOrigin,
      roles,
      cookie.realm ?? 'root',
      platformOrigin,
    );
    throw redirect(303, destination);
  }

  // Final fallbacks.
  if (isGotoOnFail) {
    throw redirect(303, '/failure-redirect');
  }
  throw redirect(
    303,
    `${new URL(AM_DOMAIN_PATH).origin}/enduser/?realm=/${cookie.realm && cookie.realm !== 'root' ? cookie.realm : ''}#/`,
  );
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
