/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load = ({ url }: RequestEvent) => {
  // ?realm=/alpha → "alpha", ?realm=/ → "root", absent → "root" (admin default)
  const realmParam = url.searchParams.get('realm');
  let realmPath: string;
  if (realmParam != null) {
    const stripped = realmParam.replace(/^\/+/, '');
    realmPath = stripped || 'root';
  } else {
    realmPath = 'root';
  }

  return {
    amUrl: env.FR_AM_URL ?? '',
    clientId: env.FR_OAUTH_PUBLIC_CLIENT ?? '',
    realmPath,
    scope: env.FR_OAUTH_SCOPE,
  };
};
