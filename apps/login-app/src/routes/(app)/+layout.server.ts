/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { error } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { fetchIdmTheme } from '$server/idm-theme.effects';
import { normalizeRealm, resolveRequestedRealm } from '$server/redirect/redirect.utilities';
import { fetchServerInfoRealm, resolveOAuthRealmPath } from '$server/sessions';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const amUrl = env.FR_AM_URL;
  const configuredWellknownUrl = env.FR_AM_WELLKNOWN_URL;
  const idmBaseUrl = env.FR_IDM_URL ?? amUrl;

  if (!amUrl || !configuredWellknownUrl) {
    throw error(
      500,
      'Login App is not configured. Ensure the required environment variables FR_AM_URL, FR_AM_COOKIE_NAME, FR_REALM_PATH, and FR_AM_WELLKNOWN_URL are set before starting the app.',
    );
  }

  // Deriving the sibling well-known paths takes the URL's path, so a malformed
  // FR_AM_URL is a configuration error, not a per-request crash.
  let amBasePath: string;
  try {
    amBasePath = new URL(amUrl).pathname.replace(/\/+$/, '');
  } catch {
    throw error(500, 'Login App is not configured: FR_AM_URL must be an absolute URL.');
  }

  // ?realm=/alpha → "alpha", ?realm=/ → "root", absent → configured FR_REALM_PATH (defaults to root).
  const requestedRealm = resolveRequestedRealm(url, env.FR_REALM_PATH);

  // serverinfo answers what realm the arrival host resolves to:
  //   host = the tenant's own AM hostname (e.g. openam-sdks.forgeblocks.com)
  //          → root — the deployment hostname belongs to the top-level realm
  //   host = custom domain (e.g. id.petrov.ca)
  //          → its alias realm (alpha)
  const hostRealm = await fetchServerInfoRealm(amUrl, url.host);

  const configuredRealm = normalizeRealm(env.FR_REALM_PATH);
  const amOrigin = new URL(amUrl).origin;

  // The OIDC wellknown url resolved per request; the
  // configured URL above is only one of its three possible forms.
  let requestedWellknownUrl: string;
  if (hostRealm === requestedRealm) {
    // Arrival host serves the requested realm → its native realm-less form.
    requestedWellknownUrl = new URL(
      `${amBasePath}/oauth2/.well-known/openid-configuration`,
      url.origin,
    ).toString();
  } else if (requestedRealm === configuredRealm) {
    requestedWellknownUrl = new URL(configuredWellknownUrl, url.origin).toString();
  } else {
    // Realm-qualified discovery is only valid on the AM FQDN origin; root
    // needs no realm suffix — hence resolveOAuthRealmPath.
    requestedWellknownUrl = new URL(
      `${amBasePath}${resolveOAuthRealmPath(requestedRealm)}/.well-known/openid-configuration`,
      amOrigin,
    ).toString();
  }

  const journeyName = url.searchParams.get('journey') ?? env.FR_AM_JOURNEY_LOGIN ?? null;
  const {
    theme: idmTheme,
    themeCatalog,
    backgroundImageUrl,
  } = idmBaseUrl
    ? await fetchIdmTheme(idmBaseUrl, requestedRealm, journeyName)
    : { theme: undefined, themeCatalog: {}, backgroundImageUrl: undefined };

  return {
    amUrl,
    backgroundImageUrl,
    idmTheme,
    themeCatalog,
    realmPath: requestedRealm,
    wellknown: requestedWellknownUrl,
    fallbackJourney: env.FR_AM_JOURNEY_LOGIN ?? null,
  };
};
