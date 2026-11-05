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

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const amUrl = env.FR_AM_URL;
  const wellknownUrl = env.FR_AM_WELLKNOWN_URL;
  const idmBaseUrl = env.FR_IDM_URL ?? amUrl;

  if (!amUrl || !wellknownUrl) {
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
  const realmPath = resolveRequestedRealm(url, env.FR_REALM_PATH);

  // serverinfo resolves the realm the arrival host aliases to. When it carries
  // the requested realm, the URL must stay realm-less — a realm-qualified path
  // double-references the realm and journey-client resolves root (IAM-12293).
  let aliasedRealm: string | null = null;
  try {
    const response = await fetch(new URL(`${amBasePath}/json/serverinfo/*`, url.origin));
    const body = (await response.json()) as { realm?: unknown };
    if (typeof body.realm === 'string') {
      aliasedRealm = normalizeRealm(body.realm);
    }
  } catch {
    // No alias answer: keep the realm-qualified form below.
  }

  const configuredRealm = normalizeRealm(env.FR_REALM_PATH);
  const wellknown =
    aliasedRealm !== null && aliasedRealm === realmPath
      ? new URL(`${amBasePath}/oauth2/.well-known/openid-configuration`, url.origin).toString()
      : new URL(
          realmPath === configuredRealm
            ? wellknownUrl
            : realmPath === 'root'
            ? `${amBasePath}/oauth2/realms/root/.well-known/openid-configuration`
            : `${amBasePath}/oauth2/realms/root/realms/${realmPath}/.well-known/openid-configuration`,
          url.origin,
        ).toString();

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
    fallbackJourney: env.FR_AM_JOURNEY_LOGIN ?? null,
  };
};
