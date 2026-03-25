/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';
import { extractDomainFromUrl } from '$core/server/_utilities';

const realmPath =
  env.FR_REALM_PATH && env.FR_REALM_PATH !== 'root'
    ? `realms/${env.FR_REALM_PATH}`
    : '';

export const AM_COOKIE_NAME = env.FR_AM_COOKIE_NAME ?? '';
export const AM_DOMAIN_PATH = env.FR_AM_URL ?? '';
export const AM_DOMAIN = env.FR_AM_URL ? extractDomainFromUrl(env.FR_AM_URL) : '';
export const APP_DOMAIN = env.APP_DOMAIN ?? 'localhost';
export const JSON_REALM_PATH = `/json/realms/root/${realmPath}`;
export const OAUTH_REALM_PATH = `/oauth2/realms/root/${realmPath}`;
