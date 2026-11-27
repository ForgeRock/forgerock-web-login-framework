/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { env } from '$env/dynamic/private';

import type { CustomDomainConflict } from './realm.types';

const VALID_REALM = /^[A-Za-z0-9_-]+$/;

/**
 *   value = '/alpha/'  →  returns 'alpha'
 *   value = '/'        →  returns 'root'
 */
export function normalizeRealm(value?: string | null): string {
  const normalized = (value ?? '').replace(/^\/+|\/+$/g, '');
  return normalized || 'root';
}

export function isValidRealm(realm: string): boolean {
  return VALID_REALM.test(realm);
}

export function resolveRequestedRealm(url: URL, configuredRealm?: string): string {
  const configured = normalizeRealm(configuredRealm);
  const realmParam = url.searchParams.get('realm');
  if (realmParam === null) {
    return configured;
  }
  const realm = normalizeRealm(realmParam);
  return isValidRealm(realm) ? realm : configured;
}

export function resolveJsonRealmPath(realm?: string): string {
  const normalizedRealm = normalizeRealm(realm ?? env.FR_REALM_PATH ?? 'root');
  if (normalizedRealm === 'root' || !isValidRealm(normalizedRealm)) {
    return '/json/realms/root';
  }

  return `/json/realms/root/realms/${normalizedRealm}`;
}

export function resolveOAuthRealmPath(realm?: string): string {
  return resolveJsonRealmPath(realm).replace('/json/', '/oauth2/');
}

export function originIsCustomDomain(servedRealm: string | null): servedRealm is string {
  return servedRealm !== null && servedRealm !== 'root';
}

export function originIsDefaultDomain(servedRealm: string | null): servedRealm is string {
  return servedRealm === 'root';
}

/**
 *   customDomainConflict(url '?realm=bravo', 'bravo', 'alpha')
 *     → { message: "Realm 'bravo' is not available on this domain. …",
 *         customDomainUrl: "<url without ?realm>", customDomainRealm: 'alpha' }
 *   customDomainConflict(url '?realm=alpha', 'alpha', 'alpha')  →  null
 */
export function customDomainConflict(
  url: URL,
  requestedRealm: string,
  servedRealm: string | null,
): CustomDomainConflict | null {
  if (!originIsCustomDomain(servedRealm) || requestedRealm === servedRealm) return null;

  let customDomainUrl: string | undefined;
  if (url.searchParams.has('realm')) {
    const urlWithoutRealm = new URL(url.href);
    urlWithoutRealm.searchParams.delete('realm');
    customDomainUrl = urlWithoutRealm.href;
  }
  return {
    message: `Realm '${requestedRealm}' is not available on this domain. This custom domain is serving the '${servedRealm}' realm.`,
    ...(customDomainUrl ? { customDomainUrl } : {}),
    customDomainRealm: servedRealm,
  };
}
