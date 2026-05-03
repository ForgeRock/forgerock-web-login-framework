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
import { type RedirectData, type RedirectFormValue, type Resolver } from './redirect.types';
import { tokenIdSchema } from '$server/schemas';

/**
 * Returns true if the URL is an AM OAuth2 authorize endpoint.
 * These URLs must never be used as a top-level redirect destination:
 * appAuthHelperRedirect.html is designed to run inside a hidden iframe
 * and post tokens back to the parent SPA. A main-frame navigation there loops.
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
 * as a top-level destination would loop. Checks both host and pathname.
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
    const pathname = url.split('?')[0].split('#')[0];
    return (
      pathname === '/enduser' ||
      pathname.startsWith('/enduser/') ||
      pathname === '/login' ||
      pathname.startsWith('/login/')
    );
  }
}

/**
 * @function resolveRedirect - Resolves a final redirect URL from the provided context.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string} The resolved redirect URL.
 */
export function resolveRedirect(redirectContext: RedirectData): string {
  const resolved = firstOf(
    redirectContext,
    getSuccessRedirect,
    getDefaultPathRedirect,
    getSamlRedirect,
    getJourneyStepRedirect,
    getRoleRedirect,
  );

  return resolved ?? getFallbackRedirect(redirectContext);
}

/**
 * @function firstOf - Composes a pipeline of redirect resolvers, returning the first non-null result.
 * @param {...Resolver[]} resolvers - A list of resolver functions evaluated in order (earlier resolvers have higher precedence).
 * @returns {string | null} The first non-null redirect URL, or null if none match.
 */
function firstOf(redirectContext: RedirectData, ...resolvers: Resolver[]): string | null {
  for (const resolve of resolvers) {
    const url = resolve(redirectContext);
    if (url != null) return url;
  }
  return null;
}

/**
 * @function buildRoleUrl - Builds a role-based redirect URL for a user after login.
 * @param {string} amOrigin - The AM server origin.
 * @param {string[]} roles - The user's roles.
 * @param {string | undefined} realm - The realm name.
 * @param {string | undefined} platformOrigin - Optional separate origin for platform-ui. Defaults to amOrigin.
 * @returns {string} The role-based redirect URL.
 */
export function buildRoleUrl(
  amOrigin: string,
  roles: string[],
  realm: string | undefined,
  platformOrigin?: string,
): string {
  const origin = platformOrigin || amOrigin;
  const isAdmin = roles.includes('ui-global-admin') || roles.includes('ui-realm-admin');
  const realmPath = realm && realm !== 'root' ? `/${realm}` : '/';
  return isAdmin ? `${origin}/platform/?realm=${realmPath}` : `${origin}/enduser/?realm=${realmPath}#/`;
}

/**
 * @function parseRedirectForm - parses the redirect form data into a structured object
 * @param {FormData} formData - The form data from the request
 * @returns {RedirectFormValue} The parsed form values
 */
export function parseRedirectForm(formData: FormData): RedirectFormValue {
  const str = z.preprocess((v) => (typeof v === 'string' ? v : ''), z.string());
  const formSchema = z.object({
    loginResult: str.pipe(z.enum(['success', 'failure']).catch('failure')),
    tokenId: str.pipe(tokenIdSchema),
    journeyStepUrl: str,
  });

  return formSchema.parse({
    loginResult: formData.get('loginResult'),
    tokenId: formData.get('tokenId'),
    journeyStepUrl: formData.get('journeyStepUrl'),
  });
}

/**
 * @function isDefaultPath - Checks if the given URL or path ends with 'console'.
 * @param {string | null | undefined} urlOrPath - The URL or path to check.
 * @returns {boolean} True if the last segment is 'console', false otherwise.
 */
export function isDefaultPath(urlOrPath: string | null | undefined): boolean {
  if (!urlOrPath) {
    return false;
  }
  const pathname = urlOrPath.split('?')[0].split('#')[0];
  const lastSegment = pathname.split('/').filter(Boolean).at(-1);
  return lastSegment === 'console';
}

/**
 * @function resolveAgainstOrigin - Resolves a relative URL or path against a given origin, returning an absolute URL.
 * @param {string} urlOrPath - The URL or path to resolve.
 * @param {string} origin - The base origin to resolve against.
 * @returns {string} The resolved absolute URL, or the original input if invalid.
 */
export function resolveAgainstOrigin(urlOrPath: string, amOrigin: string): string {
  try {
    return new URL(urlOrPath, amOrigin).href;
  } catch {
    return urlOrPath;
  }
}

/**
 * @function getSuccessRedirect - Returns the successUrl if it is not a default path, otherwise null.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The success URL or null.
 */
function getSuccessRedirect(redirectContext: RedirectData): string | null {
  const { successUrl, amOrigin } = redirectContext;
  if (
    successUrl &&
    !isDefaultPath(successUrl) &&
    !isLoginAppPath(successUrl, amOrigin) &&
    !isOAuthAuthorizePath(successUrl)
  ) {
    return resolveAgainstOrigin(successUrl, amOrigin);
  }
  return null;
}

/**
 * @function getDefaultPathRedirect - Handles default path redirects based on context state.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The resolved journey step URL or null.
 */
function getDefaultPathRedirect(redirectContext: RedirectData): string | null {
  const { successUrl, journeyStepUrl, amOrigin } = redirectContext;
  if (
    isDefaultPath(successUrl) &&
    journeyStepUrl &&
    !isDefaultPath(journeyStepUrl) &&
    !isLoginAppPath(resolveAgainstOrigin(journeyStepUrl, amOrigin), amOrigin) &&
    !isOAuthAuthorizePath(journeyStepUrl)
  ) {
    return resolveAgainstOrigin(journeyStepUrl, amOrigin);
  }
  return null;
}

/**
 * @function getSamlRedirect - Returns a SAML redirect URL if the context matches SAML conditions.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The SAML redirect URL or null.
 */
function getSamlRedirect(redirectContext: RedirectData): string | null {
  const gotoUrl = redirectContext.gotoUrl;
  const isSamlUrl = gotoUrl.includes('/Consumer/metaAlias') || gotoUrl.includes('/saml2');
  if (isDefaultPath(redirectContext.successUrl) && isSamlUrl) {
    return resolveAgainstOrigin(gotoUrl, redirectContext.amOrigin);
  }
  return null;
}

/**
 * @function getJourneyStepRedirect - Returns the journey-provided redirect URL when present.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The resolved journey step URL or null.
 */
function getJourneyStepRedirect(redirectContext: RedirectData): string | null {
  const { journeyStepUrl, amOrigin } = redirectContext;
  if (
    journeyStepUrl &&
    !isDefaultPath(journeyStepUrl) &&
    !isLoginAppPath(resolveAgainstOrigin(journeyStepUrl, amOrigin), amOrigin) &&
    !isOAuthAuthorizePath(journeyStepUrl)
  ) {
    return resolveAgainstOrigin(journeyStepUrl, amOrigin);
  }
  return null;
}

/**
 * @function getRoleRedirect - Returns a role-based redirect URL for the user, if applicable.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The role-based redirect URL or null.
 */

function getRoleRedirect(redirectContext: RedirectData): string | null {
  if (!redirectContext.isGotoOnFail && redirectContext.tokenId) {
    const { roles, realm, amOrigin, platformOrigin } = redirectContext;
    return buildRoleUrl(amOrigin, roles, realm, platformOrigin);
  }
  return null;
}

/**
 * @function getFallbackRedirect - Returns a fallback redirect URL based on the context.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string} The fallback redirect URL.
 */
function getFallbackRedirect(redirectContext: RedirectData): string {
  if (redirectContext.isGotoOnFail) {
    return '/failure-redirect';
  }
  const { amOrigin, platformOrigin, realm } = redirectContext;
  const origin = platformOrigin || amOrigin;
  const realmSuffix = realm && realm !== 'root' ? realm : '';
  return `${origin}/enduser/?realm=/${realmSuffix}#/`;
}
