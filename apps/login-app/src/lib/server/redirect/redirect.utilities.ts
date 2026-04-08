/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';
import { type RedirectData, type RedirectFormValue, type Resolver } from './redirect.types';
import { tokenIdSchema } from '$server/schemas';

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
  return redirectContext.successUrl && !isDefaultPath(redirectContext.successUrl)
    ? resolveAgainstOrigin(redirectContext.successUrl, redirectContext.amOrigin)
    : null;
}

/**
 * @function getDefaultPathRedirect - Handles default path redirects based on context state.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The resolved journey step URL or null.
 */
function getDefaultPathRedirect(redirectContext: RedirectData): string | null {
  if (isDefaultPath(redirectContext.successUrl) && !isDefaultPath(redirectContext.journeyStepUrl)) {
    return resolveAgainstOrigin(redirectContext.journeyStepUrl, redirectContext.amOrigin);
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
  return redirectContext.journeyStepUrl
    ? resolveAgainstOrigin(redirectContext.journeyStepUrl, redirectContext.amOrigin)
    : null;
}

/**
 * @function getRoleRedirect - Returns a role-based redirect URL for the user, if applicable.
 * @param {RedirectData} redirectContext - The redirect context.
 * @returns {string | null} The role-based redirect URL or null.
 */

function getRoleRedirect(redirectContext: RedirectData): string | null {
  if (!redirectContext.isGotoOnFail && redirectContext.tokenId) {
    const roles = redirectContext.roles;
    const isAdmin = roles.includes('ui-global-admin') || roles.includes('ui-realm-admin');
    const realm = redirectContext.realm;
    const realmPath = realm && realm !== 'root' ? `/${realm}` : '/';
    return isAdmin
      ? `${redirectContext.amOrigin}/platform/?realm=${realmPath}`
      : `${redirectContext.amOrigin}/enduser/?realm=${realmPath}#/`;
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
  return '/success-redirect';
}
