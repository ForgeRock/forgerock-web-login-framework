/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { building } from '$app/environment';
import { extractDomainFromUrl } from '$core/server/_utilities';
import { env } from '$env/dynamic/private';

if (!building) {
  const REQUIRED_ENV = ['FR_AM_URL', 'FR_AM_COOKIE_NAME', 'FR_REALM_PATH'] as const;
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your AM connection details.',
    );
  }
}

const configuredRealm = env.FR_REALM_PATH?.replace(/^\/+/, '') ?? '';
const realmPath = configuredRealm && configuredRealm !== 'root' ? `realms/${configuredRealm}` : '';

/** Full AM base URL with any trailing slash stripped, so route templates that
 * append `/json/...` never produce an empty path element (AM rejects those). */
export const AM_DOMAIN_PATH = env.FR_AM_URL?.replace(/\/+$/, '') ?? '';
export const AM_COOKIE_NAME = env.FR_AM_COOKIE_NAME ?? '';
/** Extracted hostname from AM URL (e.g. host.example.com) */
export const AM_DOMAIN = env.FR_AM_URL ? extractDomainFromUrl(env.FR_AM_URL) : '';
export const JSON_REALM_PATH = `/json/realms/root/${realmPath}`;
export const OAUTH_REALM_PATH = `/oauth2/realms/root/${realmPath}`;
