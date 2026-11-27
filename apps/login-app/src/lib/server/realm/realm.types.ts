/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/** The 404 payload a cross-realm arrival on a custom domain receives. */
export interface CustomDomainConflict {
  readonly message: string;
  readonly customDomainUrl?: string;
  readonly customDomainRealm: string;
}

/**
 * What resolveRealm answers: the realm a login runs in with its discovery
 * URL, or the conflict the route must surface as a 404.
 */
export type RealmResolution =
  | { readonly kind: 'ok'; readonly requestedRealm: string; readonly wellknown: string }
  | { readonly kind: 'conflict'; readonly conflict: CustomDomainConflict };
