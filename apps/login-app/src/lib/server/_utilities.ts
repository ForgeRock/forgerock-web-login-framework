/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

interface RewriteCookieParams {
  cookie: string;
  amDomain: string;
  appDomain: string;
}

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
