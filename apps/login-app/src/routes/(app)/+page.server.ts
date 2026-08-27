/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';

import { getLocale } from '$core/_utilities/i18n.utilities';
import { AM_COOKIE_NAME, AM_DOMAIN_PATH } from '$core/constants';
import {
  createRedirectContext,
  readAndClearRedirectCookie,
  storeRedirectParams,
} from '$server/redirect/redirect.effects';
import { resolveRealmFromUrl } from '$server/redirect/redirect.utilities';
import { buildRoleUrl, resolveRedirect } from '$server/redirect/redirect.utilities';
import { tokenIdSchema } from '$server/schemas';
import { getHttpCookie, getUserIdFromSession, getUserRolesFromSession } from '$server/sessions';

import type { z } from 'zod';

import type { PageServerLoad } from './$types';
import type { stringsSchema } from '$core/locale.store';

export const load: PageServerLoad = async (event: RequestEvent) => {
  // Pre-flight: if the user already has a valid AM session, skip the login form
  // and redirect them directly to their portal. Skip when a specific journey or
  // authIndexValue is requested — the user may be intentionally navigating to a
  // different flow (e.g. password reset).
  const hasIntentionalJourney =
    event.url.searchParams.has('journey') || event.url.searchParams.has('authIndexValue');
  const rawTokenId = !hasIntentionalJourney
    ? getHttpCookie(event.cookies, AM_COOKIE_NAME)
    : undefined;
  const parsedTokenId = rawTokenId ? tokenIdSchema.safeParse(rawTokenId) : undefined;
  const tokenId = parsedTokenId?.success ? parsedTokenId.data : undefined;
  if (tokenId) {
    try {
      const amOrigin = new URL(AM_DOMAIN_PATH).origin;
      const realm = resolveRealmFromUrl(event.url);

      // Validate the session is live before acting on it.
      const userId = await getUserIdFromSession(tokenId, realm);
      if (!userId) throw new Error('Session invalid or expired');

      // If goto is an AM OAuth authorize URL, redirect there directly so the SPA's
      // iframe PKCE mechanism completes without a full login prompt.
      const goto = event.url.searchParams.get('goto');
      if (goto) {
        try {
          const gotoUrl = new URL(goto, amOrigin);
          if (
            gotoUrl.origin === amOrigin &&
            gotoUrl.pathname.includes('/oauth2/') &&
            gotoUrl.pathname.endsWith('/authorize')
          ) {
            throw redirect(303, gotoUrl.href);
          }
        } catch (e) {
          if (isRedirect(e)) throw e;
        }
      }

      const roles = await getUserRolesFromSession(tokenId, realm);
      throw redirect(303, buildRoleUrl(amOrigin, roles, realm));
    } catch (err) {
      // Only re-throw SvelteKit redirects; ignore AM errors (expired/invalid session)
      if (isRedirect(err)) throw err;
    }
  }

  const userLocale = event.request.headers.get('accept-language') || 'en-US';
  const locale = getLocale(userLocale, '/');
  const [country, lang] = locale.split('/');

  let localeContent: { default: z.infer<typeof stringsSchema> };

  try {
    localeContent = await import(`$locales/${country}/${lang}/index.json`);
  } catch (err) {
    console.error(`User locale content for ${userLocale} was not found.`);

    // TODO: Reevaluate use of JS versus JSON without breaking type generation for lib
    // eslint-disable-next-line
    // @ts-ignore
    localeContent = await import(`$locales/us/en/index.json`);
  }

  const redirectParams = storeRedirectParams(event);

  return {
    content: localeContent.default,
    redirectParams,
  };
};

export const actions = {
  default: async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const cookie = readAndClearRedirectCookie(event);
    const redirectContext = await createRedirectContext(formData, cookie);
    const url = resolveRedirect(redirectContext);
    redirect(303, url);
  },
};
