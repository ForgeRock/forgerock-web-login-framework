/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

export const REDIRECT_QUERY_PARAMS = 'redirect_query_params';

/**
 * Normalize common redirect inputs into something URL parsing + AM validateGoto can consistently handle.
 *
 * Examples:
 * - '/path' stays as it is
 * - 'https://…' stays as it is
 * - 'example.com/path' becomes 'https://example.com/path'
 */
export function normalizeRedirectParam(input: string, baseOrigin: string): string | null {
  try {
    const normalizedUrl =
      input.startsWith('http://') || input.startsWith('https://') || input.startsWith('/')
        ? input
        : `https://${input}`;

    const parsed = new URL(normalizedUrl, baseOrigin);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

    return parsed.href;
  } catch {
    return null;
  }
}
