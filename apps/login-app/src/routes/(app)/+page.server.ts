/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { RequestEvent } from '@sveltejs/kit';
import { redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { z } from 'zod';

import { env } from '$env/dynamic/private';
import { AM_COOKIE_NAME, AM_DOMAIN_PATH } from '$core/constants';
import { getLocale } from '$core/_utilities/i18n.utilities';
import { storeRedirectParams, handleRedirectAction } from '$server/redirect/redirect';
import { getHttpCookie, getUserIdFromSession, getUserRolesFromSession } from '$server/sessions';
import { getRedirectUrlBasedOnRole } from '$server/_utilities';

import type { stringsSchema } from '$core/locale.store';

export const load: PageServerLoad = async (event: RequestEvent) => {
  // If the user already has a valid AM session, skip the login form and send
  // them directly to their portal. This prevents a redirect loop when the LB
  // routes /enduser/ back to this app for already-authenticated users.
  // Skip when a specific journey or authIndexValue is requested — the user
  // may be intentionally navigating to a different flow (e.g. password reset).
  const hasIntentionalJourney =
    event.url.searchParams.has('journey') || event.url.searchParams.has('authIndexValue');
  const tokenId = !hasIntentionalJourney ? getHttpCookie(event, AM_COOKIE_NAME) : undefined;
  if (tokenId) {
    try {
      const amOrigin = new URL(AM_DOMAIN_PATH).origin;

      // Validate the session is actually live before acting on it.
      // getUserRolesFromSession silently returns [] for invalid sessions,
      // which would cause the OAuth bypass below to loop after logout.
      const userId = await getUserIdFromSession(tokenId);
      if (!userId) throw new Error('Session invalid or expired');

      // If the goto is an AM OAuth authorize URL, redirect there directly.
      // AM will see the valid session and immediately complete the OAuth flow
      // (redirecting to appAuthHelperRedirect.html), so the SPA's iframe PKCE
      // mechanism works correctly. Without this, the load function would redirect
      // to /enduser/, the SPA would reload and retry OAuth, causing an infinite loop.
      const goto = event.url.searchParams.get('goto');
      if (goto) {
        try {
          const gotoUrl = new URL(goto);
          if (
            gotoUrl.origin === amOrigin &&
            gotoUrl.pathname.includes('/oauth2/') &&
            gotoUrl.pathname.endsWith('/authorize')
          ) {
            throw redirect(303, goto);
          }
        } catch (e) {
          if (isRedirect(e)) throw e;
        }
      }

      const roles = await getUserRolesFromSession(tokenId);
      const platformOrigin = env.FR_PLATFORM_ORIGIN || undefined;
      const realmParam = event.url.searchParams.get('realm');
      const realm = realmParam != null ? realmParam.replace(/^\/+/, '') || 'root' : 'root';
      const destination = getRedirectUrlBasedOnRole(
        amOrigin,
        roles,
        realm,
        platformOrigin,
      );
      throw redirect(303, destination);
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
    return handleRedirectAction(event);
  },
};
