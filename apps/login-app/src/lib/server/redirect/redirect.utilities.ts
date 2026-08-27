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
import { tokenIdSchema } from '$server/schemas';
import { type RedirectData, type RedirectFormValue, type Resolver } from './redirect.types';

const VALID_REALM = /^[A-Za-z0-9_-]+$/;

/**
 * Resolves a realm from a `?realm=` query parameter, falling back to the configured realm.
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
 * @param {string} amOrigin - The AM server origin (also serves platform-ui under /platform and /enduser).
 * @param {string[]} roles - The user's roles.
 * @param {string | undefined} realm - The realm name.
 * @returns {string} The role-based redirect URL.
 */
export function buildRoleUrl(amOrigin: string, roles: string[], realm: string | undefined): string {
  const isAdmin = roles.includes('ui-global-admin') || roles.includes('ui-realm-admin');
  const realmPath = realm && realm !== 'root' ? `/${realm}` : '/';
  return isAdmin
    ? `${amOrigin}/platform/?realm=${realmPath}`
    : `${amOrigin}/enduser/?realm=${realmPath}#/`;
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

function isLoginAppPath(url: string, amOrigin: string): boolean {
  try {
    const parsed = new URL(url, amOrigin);
    return parsed.host === new URL(amOrigin).host && parsed.pathname.startsWith('/login');
  } catch {
    return false;
  }
}

function isOAuthAuthorizePath(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return pathname.includes('/oauth2/') && pathname.endsWith('/authorize');
  } catch {
    const pathname = url.split('?')[0].split('#')[0];
    return pathname.includes('/oauth2/') && pathname.endsWith('/authorize');
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
  const { successUrl, journeyStepUrl, gotoUrl, amOrigin } = redirectContext;
  const isSamlUrl = gotoUrl.includes('/Consumer/metaAlias') || gotoUrl.includes('/saml2');
  if (
    isDefaultPath(successUrl) &&
    journeyStepUrl &&
    !isSamlUrl &&
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
    const { roles, realm, amOrigin } = redirectContext;
    return buildRoleUrl(amOrigin, roles, realm);
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
  const { amOrigin, realm } = redirectContext;
  const realmSuffix = realm && realm !== 'root' ? realm : '';
  return `${amOrigin}/enduser/?realm=/${realmSuffix}#/`;
}
