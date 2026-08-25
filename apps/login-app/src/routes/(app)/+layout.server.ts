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

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const amUrl = env.FR_AM_URL;
  const realmPath = env.FR_REALM_PATH;
  const wellknown = env.FR_AM_WELLKNOWN_URL;
  const idmBaseUrl = env.FR_IDM_URL ?? amUrl;

  if (!amUrl || !realmPath || !wellknown) {
    throw error(
      500,
      'Login App is not configured. Ensure the required environment variables like FR_AM_URL, FR_REALM_PATH, and FR_AM_WELLKNOWN_URL are set before starting the app.',
    );
  }

  const journeyName = url.searchParams.get('journey') ?? env.FR_AM_JOURNEY_LOGIN ?? null;
  const { theme: idmTheme, backgroundImageUrl } = idmBaseUrl
    ? await fetchIdmTheme(idmBaseUrl, realmPath, journeyName)
    : { theme: undefined, backgroundImageUrl: undefined };

  return {
    amUrl,
    backgroundImageUrl,
    idmTheme,
    journeyName,
    realmPath,
    wellknown,
  };
};
