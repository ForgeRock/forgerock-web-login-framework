/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { get } from 'svelte/store';

import { loadCustomBundle } from '$journey/_utilities/registry/load-custom-bundle.effects';
import {
  failBundleLoad,
  runtimeRegistryStore,
  startBundleLoad,
} from '$journey/_utilities/registry/runtime-registry.store';

/** The manifest endpoint that publishes the latest bundle URL. Always same-origin. */
const MANIFEST_PATH = '/api/components/manifest';

/**
 * Loads the latest published Custom Component bundle exactly once per page
 * session, before a journey starts. Fire-and-forget: the store transition IS
 * the observer notification — `setRuntimeRegistries` flips the lifecycle to
 * `'loaded'`, `failBundleLoad` to `'failed'`, and pages react via
 * `bundleSettled`. A failed load must not block login: the journey renders
 * core components and the error is logged for the operator.
 *
 *   store status 'idle'    →  starts the load
 *   store status otherwise →  no-op (in flight or settled)
 */
export function configureCustomBundle(): void {
  if (get(runtimeRegistryStore).status !== 'idle') {
    return;
  }
  startBundleLoad();
  void settleBundle();
}

async function settleBundle(): Promise<void> {
  try {
    const response = await fetch(MANIFEST_PATH);
    if (!response.ok) {
      failBundleLoad();
      return;
    }
    const manifest: { componentsBundle?: string } = await response.json();
    const url = manifest.componentsBundle;
    if (!url) {
      failBundleLoad();
      return;
    }
    await loadCustomBundle(url);
  } catch (cause: unknown) {
    console.error(`[login-app] ${String(cause)}`);
    failBundleLoad();
  }
}
