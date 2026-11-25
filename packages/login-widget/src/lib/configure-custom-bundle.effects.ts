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

import type { z } from 'zod';

import type { customComponentsConfigSchema } from './widget.config';

/** The parsed `customComponents` configuration from `configure()`. */
type CustomComponentsConfig = z.infer<typeof customComponentsConfigSchema>;

/**
 * Loads the Custom Component bundle exactly once per widget, at `configure()`
 * time. Fire-and-forget: the store transition IS the observer notification —
 * `setRuntimeRegistries` flips the lifecycle to `'loaded'`, `failBundleLoad`
 * to `'failed'`. A failed load must not block login: journeys render core
 * components and the error is logged.
 *
 *   customComponents.manifest  →  fetch it, read `componentsBundle`, import that
 *   customComponents.url       →  import that directly (testing, dev, self-hosting)
 *
 *   store status 'idle'    →  starts the load
 *   store status otherwise →  no-op (in flight or settled)
 */
export function configureCustomBundle(customComponents: CustomComponentsConfig): void {
  if (get(runtimeRegistryStore).status !== 'idle') {
    return;
  }
  startBundleLoad();
  void settleBundle(customComponents);
}

async function settleBundle(customComponents: CustomComponentsConfig): Promise<void> {
  try {
    const url = customComponents.manifest
      ? await resolveManifestBundleUrl(customComponents.manifest)
      : customComponents.url ?? null;
    if (!url) {
      failBundleLoad();
      return;
    }
    await loadCustomBundle(url);
  } catch (cause: unknown) {
    console.error(`[login-widget] ${String(cause)}`);
    failBundleLoad();
  }
}

/**
 * Resolves the latest bundle URL from a tenant's manifest endpoint:
 *
 *   manifest reachable        →  returns manifest.componentsBundle
 *   disabled or unreachable   →  returns null
 */
const resolveManifestBundleUrl = async (manifestUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      return null;
    }
    const manifest: { componentsBundle?: string } = await response.json();
    return manifest.componentsBundle ?? null;
  } catch {
    return null;
  }
};
