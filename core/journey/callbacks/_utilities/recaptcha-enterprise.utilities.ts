/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Builds the script URL for the reCAPTCHA Enterprise provider.
 * Score-based (invisible) keys require `?render=SITE_KEY` for `execute()` to work.
 */
export function buildEnterpriseScriptSrc({
  apiUrl,
  siteKey,
  mode,
}: {
  apiUrl: string;
  siteKey: string;
  mode: 'invisible' | 'visible';
}): string {
  return mode === 'invisible' ? `${apiUrl}?render=${siteKey}` : apiUrl;
}
