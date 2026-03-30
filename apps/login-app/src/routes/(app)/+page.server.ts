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

import { normalizeRedirectParam, REDIRECT_QUERY_PARAMS } from '$lib/redirect.utilities';

type RedirectQueryParamsCookie = {
  goto?: string | null;
  gotoOnFail?: string | null;
};

export const load: PageServerLoad = async ({ request, url, cookies }) => {
  const userLocale = request.headers.get('accept-language') || 'en-US';
  const content = await loadLocaleContent(userLocale);

  const redirectUrl = url.searchParams.get('goto');
  const redirectOnFailUrl = url.searchParams.get('gotoOnFail');
  const cookieValue: RedirectQueryParamsCookie = {};

  if (redirectUrl) {
    const normalizedUrl = normalizeRedirectParam(redirectUrl, url.origin);
    if (normalizedUrl) cookieValue.goto = normalizedUrl;
  }

  if (redirectOnFailUrl) {
    const normalizedUrl = normalizeRedirectParam(redirectOnFailUrl, url.origin);
    if (normalizedUrl) cookieValue.gotoOnFail = normalizedUrl;
  }

  if (cookieValue.goto || cookieValue.gotoOnFail) {
    cookies.set(REDIRECT_QUERY_PARAMS, JSON.stringify(cookieValue), {
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: 300,
      path: '/',
    });
  }

  return { content };
};
