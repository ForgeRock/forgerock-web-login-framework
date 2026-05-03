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
  // ?realm=/alpha → "alpha", ?realm=/ → "root", absent → root.
  // Root is the correct default: it matches the old platform-ui Vue SPA behaviour
  // (which always authenticated against /am/json/realms/root with no realm param)
  // and is consistent with +page.server.ts. FR_REALM_PATH is intentionally NOT used
  // as a fallback here — it is always 'alpha' in AIC deployments and would break
  // admin login on bare /login/ requests.
  const realmParam = url.searchParams.get('realm');
  const realmPath = realmParam != null ? realmParam.replace(/^\/+/, '') || 'root' : 'root';

  return {
    amUrl: env.FR_AM_URL ?? '',
    clientId: env.FR_OAUTH_PUBLIC_CLIENT ?? '',
    realmPath,
    scope: env.FR_OAUTH_SCOPE,
  };
};
