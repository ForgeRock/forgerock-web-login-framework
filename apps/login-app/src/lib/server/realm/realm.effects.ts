/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import { fetchAm } from '$server/sessions';
import {
  customDomainConflict,
  normalizeRealm,
  originIsDefaultDomain,
  resolveOAuthRealmPath,
  resolveRequestedRealm,
} from './realm.utilities';

import type { RealmResolution } from './realm.types';

let servedRealmCache: { readonly url: string; readonly realm: string } | undefined;

/**
 *   amUrl = "https://id.petrov.ca/am"  →  Promise<"alpha">
 *
 * The realm an origin serves is deployment-constant (it changes only when the
 * domain is re-registered in AM), so a successful probe is memoized per amUrl.
 * Failures and unparseable bodies return null uncached so an outage self-heals.
 */
export async function fetchServedRealm(amUrl: string): Promise<string | null> {
  if (servedRealmCache?.url === amUrl) return servedRealmCache.realm;

  const response = await fetchAm(`${amUrl.replace(/\/+$/, '')}/json/serverinfo/*`, {
    headers: { accept: 'application/json' },
  });
  if (response.kind !== 'response' || !response.ok) return null;

  try {
    const realm = normalizeRealm(
      z.object({ realm: z.string() }).parse(JSON.parse(response.body ?? '')).realm,
    );
    servedRealmCache = { url: amUrl, realm };
    return realm;
  } catch {
    return null;
  }
}

/**
 *   resolveRealm(requestedUrl '?realm=bravo', amUrl 'https://id.petrov.ca/am')
 *     → { kind: 'conflict', conflict }   (serverinfo answers '/alpha')
 *     → { kind: 'ok', requestedRealm: 'bravo', wellknown }   (serverinfo answers '/')
 *
 * The conflict check runs before wellknown resolution — a rejected arrival
 * never computes one.
 */
export async function resolveRealm(
  requestedUrl: URL,
  env: {
    readonly amUrl: string;
    readonly configuredRealmPath: string | undefined;
    readonly configuredWellknownUrl: string;
  },
): Promise<RealmResolution> {
  const requestedRealm = resolveRequestedRealm(requestedUrl, env.configuredRealmPath);
  const servedRealm = await fetchServedRealm(env.amUrl);

  const conflict = customDomainConflict(requestedUrl, requestedRealm, servedRealm);
  if (conflict) return { kind: 'conflict', conflict };

  const requestedWellknown = new URL(
    `${env.amUrl.replace(/\/+$/, '')}${resolveOAuthRealmPath(
      requestedRealm,
    )}/.well-known/openid-configuration`,
  ).toString();
  const configuredWellknown = new URL(env.configuredWellknownUrl, requestedUrl.origin).toString();

  let wellknown = null;

  if (
    requestedRealm !== normalizeRealm(env.configuredRealmPath) &&
    originIsDefaultDomain(servedRealm)
  ) {
    wellknown = requestedWellknown;
  } else {
    wellknown = configuredWellknown;
  }

  return {
    kind: 'ok',
    requestedRealm,
    wellknown,
  };
}
