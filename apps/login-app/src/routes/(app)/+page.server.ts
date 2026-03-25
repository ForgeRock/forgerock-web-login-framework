/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { PageServerLoad } from './$types';
import { loadLocaleContent } from '$server/locale';

import { REDIRECT_QUERY_PARAMS } from '$lib/redirect.constants';

export const load: PageServerLoad = async ({ request, url, cookies }) => {
  // https://docs.pingidentity.com/pingam/8/am-oauth2/oauth2-parameters.html#redirect-uri
  const redirectUri = url.searchParams.get('goto');

  const userLocale = request.headers.get('accept-language') || 'en-US';
  const content = await loadLocaleContent(userLocale);

  if (redirectUri) {
    try {
      // Normalize common inputs into something URL parsing + AM validateGoto can consistently handle.
      // Examples:
      // - '/path' stays relative (will be resolved against this app's origin below)
      // - 'example.com/path' becomes 'https://example.com/path'
      // - 'https://…' stays as-is
      const normalizedRedirectUri =
        redirectUri.startsWith('http://') ||
        redirectUri.startsWith('https://') ||
        redirectUri.startsWith('/')
          ? redirectUri
          : `https://${redirectUri}`;

      // Parse into a real URL object. If the input is relative (e.g. '/path'), use this app's origin
      // as the base so we end up with a full absolute URL in `parsed.href`.
      const parsed = new URL(normalizedRedirectUri, url.origin);

      // Only persist http(s) redirects. Other schemes like 'javascript:' are ignored.
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        cookies.set(REDIRECT_QUERY_PARAMS, parsed.href, {
          httpOnly: true,
          sameSite: 'lax',
          secure: url.protocol === 'https:',
          maxAge: 300,
          path: '/',
        });
      }
    } catch {
      // Ignore invalid redirectUri values
    }
  }

  return { content };
};
