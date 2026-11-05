/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';

const realmPath =
  env.FR_REALM_PATH && env.FR_REALM_PATH !== 'root' ? `realms/${env.FR_REALM_PATH}` : '';

/** Full AM base URL (e.g. https://host.example.com/am) */
export const AM_DOMAIN_PATH = env.FR_AM_URL ?? '';
export const AM_COOKIE_NAME = env.FR_AM_COOKIE_NAME ?? '';
export const JSON_REALM_PATH = `/json/realms/root/${realmPath}`;
