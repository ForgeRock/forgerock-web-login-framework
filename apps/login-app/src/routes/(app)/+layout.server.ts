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
import { resolveRealm } from '$server/realm/realm.effects';

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

  try {
    new URL(amUrl);
  } catch {
    throw error(500, 'Login App is not configured: FR_AM_URL must be an absolute URL.');
  }

  const realmResolution = await resolveRealm(url, {
    amUrl,
    configuredRealmPath: env.FR_REALM_PATH,
    configuredWellknownUrl,
  });
  if (realmResolution.kind === 'conflict') throw error(404, realmResolution.conflict);

  const journeyName = url.searchParams.get('journey') ?? env.FR_AM_JOURNEY_LOGIN ?? null;
  const {
    theme: idmTheme,
    themeCatalog,
    backgroundImageUrl,
  } = idmBaseUrl
    ? await fetchIdmTheme(idmBaseUrl, realmResolution.requestedRealm, journeyName)
    : { theme: undefined, themeCatalog: {}, backgroundImageUrl: undefined };

  return {
    amUrl,
    backgroundImageUrl,
    idmTheme,
    themeCatalog,
    wellknown: realmResolution.wellknown,
    fallbackJourney: env.FR_AM_JOURNEY_LOGIN ?? null,
  };
};
