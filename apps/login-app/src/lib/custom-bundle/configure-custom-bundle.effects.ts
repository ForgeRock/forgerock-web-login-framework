/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { env } from '$env/dynamic/public';
import { loadCustomBundle } from '$journey/_utilities/registry/load-custom-bundle.effects';

import type { CustomComponentBundle } from '$journey/_utilities/registry/registry.interfaces';

let loadPromise: Promise<CustomComponentBundle | null> | null = null;

/**
 * Loads the configured Custom Component bundle exactly once per page session,
 * before a journey starts. A failed load must not block login: the journey
 * renders core components and the error is logged for the operator.
 *
 *   PUBLIC_COMPONENT_BUNDLE_URL unset          →  returns null (nothing loaded)
 *   bundle loads and validates                 →  returns the bundle contents
 *   fetch or validation fails                  →  logs, returns null
 */
export function configureCustomBundle(): Promise<CustomComponentBundle | null> {
  const url = env.PUBLIC_COMPONENT_BUNDLE_URL;
  if (!url) {
    return Promise.resolve(null);
  }
  loadPromise ??= loadCustomBundle(url).catch((cause: unknown) => {
    console.error(`[login-app] ${String(cause)}`);
    loadPromise = null;
    return null;
  });
  return loadPromise;
}
