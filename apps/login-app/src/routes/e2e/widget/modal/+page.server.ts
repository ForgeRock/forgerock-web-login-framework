/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';
import { fetchIdmTheme } from '$server/idm-theme.effects';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const amUrl = env.FR_AM_URL;
  const realmPath = env.FR_REALM_PATH;
  const idmBaseUrl = env.FR_IDM_URL ?? amUrl;

  if (!amUrl || !realmPath) {
    return { idmTheme: undefined };
  }

  const journeyName =
    url.searchParams.get('journey') ?? url.searchParams.get('authIndexValue') ?? 'TEST_Login';
  const { theme } = await fetchIdmTheme(idmBaseUrl, realmPath, journeyName);

  return { idmTheme: theme };
};
