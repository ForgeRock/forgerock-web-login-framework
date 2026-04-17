/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({
  amUrl: env.FR_AM_URL ?? '',
  clientId: env.FR_OAUTH_PUBLIC_CLIENT ?? '',
  realmPath: env.FR_REALM_PATH ?? '',
  scope: env.FR_OAUTH_SCOPE,
  wellknown: env.FR_AM_WELLKNOWN_URL ?? '',
});
