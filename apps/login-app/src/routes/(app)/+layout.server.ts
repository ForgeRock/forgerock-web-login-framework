/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { error } from '@sveltejs/kit';
import { z } from 'zod';

import { env } from '$env/dynamic/private';
import { fetchIdmTheme } from '$server/idm-theme.effects';
import { normalizeRealm, resolveRequestedRealm } from '$server/redirect/redirect.utilities';
import { fetchAm, resolveOAuthRealmPath } from '$server/sessions';

import type { LayoutServerLoad } from './$types';

// The realm the configured origin serves is deployment-constant (it only
// changes when the domain is re-registered in AM), so the first successful
// serverinfo answer is cached for the process lifetime. Failures stay
// uncached so an outage self-heals.
let servedRealm: string | null = null;

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

  const configuredRealm = normalizeRealm(env.FR_REALM_PATH);
  const amOrigin = new URL(amUrl).origin;

  // serverinfo: default domain answers '/', custom domain its alias realm.
  // Realm-qualified discovery is default-domain-only, so anything else falls back to
  // the configured wellknown. The served realm is process-cached above.
  if (servedRealm === null) {
    const serverInfoResponse = await fetchAm(`${amUrl.replace(/\/+$/, '')}/json/serverinfo/*`, {
      headers: { accept: 'application/json' },
    });
    if (serverInfoResponse.kind === 'response' && serverInfoResponse.ok) {
      try {
        servedRealm = normalizeRealm(
          z.object({ realm: z.string() }).parse(JSON.parse(serverInfoResponse.body ?? '')).realm,
        );
      } catch {
        // unparseable body: leave null so the next request retries
      }
    }
  }
  const originIsDefaultDomain = servedRealm === 'root';

  // A custom domain serves exactly one realm. A different realm cannot be
  // authenticated on it: the journey would run against the configured realm's
  // wellknown and the attempt would fail or land in the wrong realm.
  if (servedRealm !== null && servedRealm !== 'root' && requestedRealm !== servedRealm) {
    throw error(
      404,
      `Realm '${requestedRealm}' is not available on this domain. This domain serves the '${servedRealm}' realm only.`,
    );
  }

  let requestedWellknownUrl: string;
  if (requestedRealm === configuredRealm || !originIsDefaultDomain) {
    requestedWellknownUrl = new URL(configuredWellknownUrl, url.origin).toString();
  } else {
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
