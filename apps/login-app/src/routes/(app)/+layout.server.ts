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
import { resolveRealmFromUrl } from '$server/redirect/redirect.utilities';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const amUrl = env.FR_AM_URL;
  const wellknownUrl = env.FR_AM_WELLKNOWN_URL;
  const idmBaseUrl = env.FR_IDM_URL ?? amUrl;

  if (!amUrl || !wellknownUrl) {
    throw error(
      500,
      'Login App is not configured. Ensure the required environment variables like FR_AM_URL and FR_AM_WELLKNOWN_URL are set before starting the app.',
    );
  }

  // ?realm=/alpha → "alpha", ?realm=/ → "root", absent → configured FR_REALM_PATH (defaults to root).
  const realmPath = resolveRealmFromUrl(url);

  // Use the configured discovery endpoint for the deployment's default realm.
  // Derive a sibling endpoint only when the request explicitly selects another realm.
  const configuredRealm = (env.FR_REALM_PATH ?? 'root').replace(/^\/+/, '');
  const wellknown =
    realmPath === configuredRealm
      ? wellknownUrl
      : realmPath === 'root'
      ? `${amUrl}/oauth2/realms/root/.well-known/openid-configuration`
      : `${amUrl}/oauth2/realms/root/realms/${realmPath}/.well-known/openid-configuration`;

  const journeyName = url.searchParams.get('journey') ?? env.FR_AM_JOURNEY_LOGIN ?? null;
  const {
    theme: idmTheme,
    themeCatalog,
    backgroundImageUrl,
  } = idmBaseUrl
    ? await fetchIdmTheme(idmBaseUrl, realmPath, journeyName)
    : { theme: undefined, themeCatalog: {}, backgroundImageUrl: undefined };

  return {
    amUrl,
    backgroundImageUrl,
    idmTheme,
    themeCatalog,
    realmPath,
    wellknown,
  };
};
