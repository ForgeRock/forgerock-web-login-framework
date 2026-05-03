/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { redirect, isRedirect, type RequestEvent } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { z } from 'zod';

import { env } from '$env/dynamic/private';
import { AM_COOKIE_NAME, AM_DOMAIN_PATH } from '$core/constants';
import { getLocale } from '$core/_utilities/i18n.utilities';
import { resolveRedirect, buildRoleUrl } from '$server/redirect/redirect.utilities';
import { getHttpCookie, getUserIdFromSession, getUserRolesFromSession } from '$server/sessions';

import type { stringsSchema } from '$core/locale.store';
import {
  storeRedirectParams,
  createRedirectContext,
  readAndClearRedirectCookie,
} from '$server/redirect/redirect.effects';

export const load: PageServerLoad = async (event: RequestEvent) => {
  // Pre-flight: if the user already has a valid AM session, skip the login form
  // and redirect them directly to their portal. Skip when a specific journey or
  // authIndexValue is requested — the user may be intentionally navigating to a
  // different flow (e.g. password reset).
  const hasIntentionalJourney =
    event.url.searchParams.has('journey') || event.url.searchParams.has('authIndexValue');
  const tokenId = !hasIntentionalJourney ? getHttpCookie(event.cookies, AM_COOKIE_NAME) : undefined;
  if (tokenId) {
    try {
      const amOrigin = new URL(AM_DOMAIN_PATH).origin;

      // Validate the session is live before acting on it.
      const userId = await getUserIdFromSession(tokenId);
      if (!userId) throw new Error('Session invalid or expired');

      // If goto is an AM OAuth authorize URL, redirect there directly so the SPA's
      // iframe PKCE mechanism completes without a full login prompt.
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

      const platformOrigin = env.FR_PLATFORM_ORIGIN || undefined;
      const realmParam = event.url.searchParams.get('realm');
      let realm = realmParam != null ? realmParam.replace(/^\/+/, '') || 'root' : 'root';
      let roles = await getUserRolesFromSession(tokenId, realm);

      // If realm was not explicitly specified and role lookup returned no roles,
      // try the other realm (root-realm admins may have logged in to alpha)
      if (!realmParam && roles.length === 0) {
        const otherRealm = realm === 'alpha' ? 'root' : 'alpha';
        const otherRoles = await getUserRolesFromSession(tokenId, otherRealm);
        if (otherRoles.length > 0) {
          realm = otherRealm;
          roles = otherRoles;
        }
      }
      throw redirect(303, buildRoleUrl(amOrigin, roles, realm, platformOrigin));
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
