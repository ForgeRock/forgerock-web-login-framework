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
import { fetchAm } from '$server/sessions';

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

  // serverinfo answers what realm the arrival host resolves to:
  //   host = the tenant's own AM hostname (e.g. openam-sdks.forgeblocks.com)
  //          → root — the deployment hostname belongs to the top-level realm
  //   host = custom domain (e.g. id.petrov.ca)
  //          → its alias realm (alpha)
  // Any failure (timeout, network, unusable body) leaves aliasedRealm null → realm-qualified below.
  let aliasedRealm: string | null = null;
  const upstream = await fetchAm(new URL(`${amBasePath}/json/serverinfo/*`, url.origin).href, {
    headers: { accept: 'application/json' },
  });
  if (upstream.kind === 'response') {
    try {
      const body = JSON.parse(upstream.body ?? '') as { realm?: unknown };
      if (typeof body.realm === 'string') {
        aliasedRealm = normalizeRealm(body.realm);
      }
    } catch {
      // Body isn't JSON (e.g. a 404 HTML page) — treated as no answer.
    }
  }

  const configuredRealm = normalizeRealm(env.FR_REALM_PATH);
  const amOrigin = new URL(amUrl).origin;
  // A custom domain belongs to one realm (its alias), so discovery is always
  // realm-less on it — see the custom-domain docs' discovery endpoint
  // section. Realm-qualified discovery URLs are only valid on the AM FQDN,
  // so they are built on the FR_AM_URL origin, never the arrival origin.
  const wellknown =
    aliasedRealm === realmPath
      ? new URL(`${amBasePath}/oauth2/.well-known/openid-configuration`, url.origin).toString()
      : realmPath === configuredRealm
      ? new URL(wellknownUrl, url.origin).toString()
      : realmPath === 'root'
      ? new URL(
          `${amBasePath}/oauth2/realms/root/.well-known/openid-configuration`,
          amOrigin,
        ).toString()
      : new URL(
          `${amBasePath}/oauth2/realms/root/realms/${realmPath}/.well-known/openid-configuration`,
          amOrigin,
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
