/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

interface RewriteCookieParams {
  cookie: string;
  amDomain: string;
  appDomain: string;
}

type RedirectFormValue = {
  loginResult: 'success' | 'failure';
  tokenId: string;
  journeyStepUrl: string;
};

/**
 * @function extractDomainFromUrl - extracts the domain from a given URL string
 * @param {unknown} url - The URL to extract the domain from
 * @returns {string} The extracted domain
 * @throws {Error} If the input is not a string or not a valid URL
 */
export function extractDomainFromUrl(url: unknown) {
  if (typeof url !== 'string') {
    throw new Error('AM_DOMAIN_PATH is not a string');
  }

  /**
   * Good old Stack Overflow answer: https://stackoverflow.com/a/25703406
   *
   * Demo: https://regex101.com/r/wN6cZ7/365
   */
  const arr = url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/);
  if ((!Array.isArray(arr) && !arr) || !arr[1]) {
    throw new Error('AM_DOMAIN_PATH is not a valid URL');
  }

  return arr[1];
}

/**
 * @function rewriteCookieForClient - rewrites a cookie's domain from AM domain to app domain
 * @param {object} params - The parameters object
 * @param {string} params.cookie - The cookie string
 * @param {string} params.amDomain - The AM domain to replace
 * @param {string} params.appDomain - The app domain to use
 * @returns {string} The rewritten cookie string
 */
export function rewriteCookieForClient({ cookie, amDomain, appDomain }: RewriteCookieParams) {
  return cookie.replace(amDomain, appDomain);
}

/**
 * @function rewriteCookieForServer - rewrites a cookie's domain from app domain to AM domain
 * @param {object} params - The parameters object
 * @param {string} params.cookie - The cookie string
 * @param {string} params.amDomain - The AM domain to use
 * @param {string} params.appDomain - The app domain to replace
 * @returns {string} The rewritten cookie string
 */
export function rewriteCookieForServer({ cookie, amDomain, appDomain }: RewriteCookieParams) {
  return cookie.replace(appDomain, amDomain);
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
    tokenId: str,
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
 * @function isSamlURL - Determines if the given URL or path is related to SAML endpoints.
 * @param {string} urlOrPath - The URL or path to check.
 * @returns {boolean} True if the path contains SAML indicators, false otherwise.
 */
export function isSamlURL(urlOrPath: string): boolean {
  return urlOrPath.includes('/Consumer/metaAlias') || urlOrPath.includes('/saml2');
}

/**
 * @function getRedirectUrlBasedOnRole - Returns a redirect URL based on the user's roles and realm.
 * @param {string} amOrigin - The AM server origin.
 * @param {string[]} roles - The user's roles.
 * @param {string} realm - The realm name.
 * @returns {string} The constructed redirect URL for admin or end user.
 */
export function getRedirectUrlBasedOnRole(
  amOrigin: string,
  roles: string[],
  realm: string,
): string {
  const isAdmin = roles.includes('ui-global-admin') || roles.includes('ui-realm-admin');
  const realmPath = realm && realm !== 'root' ? `/${realm}` : '/';
  return isAdmin
    ? `${amOrigin}/platform/?realm=${realmPath}`
    : `${amOrigin}/enduser/?realm=${realmPath}#/`;
}

/**
 * @function resolveAgainstOrigin - Resolves a relative URL or path against a given origin, returning an absolute URL.
 * @param {string} urlOrPath - The URL or path to resolve.
 * @param {string} origin - The base origin to resolve against.
 * @returns {string} The resolved absolute URL, or the original input if invalid.
 */
export function resolveAgainstOrigin(urlOrPath: string, origin: string): string {
  try {
    return new URL(urlOrPath, origin).href;
  } catch {
    return urlOrPath;
  }
}
