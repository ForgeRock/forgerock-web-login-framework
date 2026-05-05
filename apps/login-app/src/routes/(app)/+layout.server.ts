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

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
  const amUrl = env.FR_AM_URL;
  const clientId = env.FR_OAUTH_PUBLIC_CLIENT;
  const realmPath = env.FR_REALM_PATH;
  const wellknown = env.FR_AM_WELLKNOWN_URL;
  const scope = env.FR_OAUTH_SCOPE;

  if (!amUrl || !realmPath || !wellknown) {
    throw error(
      500,
      'Login App is not configured. Ensure the required environment variables like FR_AM_URL, FR_REALM_PATH, and FR_AM_WELLKNOWN_URL are set before starting the app.',
    );
  }

  return {
    amUrl,
    clientId,
    realmPath,
    scope,
    wellknown,
  };
};
