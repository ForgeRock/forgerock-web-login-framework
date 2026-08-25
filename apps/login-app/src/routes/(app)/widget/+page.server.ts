/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    oauthClientId: env.FR_OAUTH_PUBLIC_CLIENT ?? '',
    oauthScope: env.FR_OAUTH_SCOPE ?? 'openid profile email',
  };
};
