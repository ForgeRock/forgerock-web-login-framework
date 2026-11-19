/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { writable } from 'svelte/store';

import type { Writable } from 'svelte/store';

import type { CustomComponentBundle, CustomRegistryEntry } from './registry.interfaces';

/** The empty state the mappers and pages see until a runtime bundle loads. */
const emptyRegistries: RuntimeRegistryState = {
  stages: {},
  callbacks: {},
  header: null,
  footer: null,
};

/** Runtime registry state: name-keyed component registries plus singular wrapper slots. */
export interface RuntimeRegistryState {
  callbacks: Record<string, CustomRegistryEntry>;
  footer: CustomRegistryEntry | null;
  header: CustomRegistryEntry | null;
  stages: Record<string, CustomRegistryEntry>;
}

/**
 * Runtime-populated custom components from an external bundle, consulted by the
 * mappers (stages/callbacks) and the page wrappers (header/footer) before the
 * compile-time sources. Empty until `setRuntimeRegistries` is called by the
 * bundle loader.
 */
export const runtimeRegistryStore: Writable<RuntimeRegistryState> = writable(emptyRegistries);

/**
 * @function setRuntimeRegistries - Replaces the runtime registries with the validated contents of a loaded bundle
 * @param {object} bundle - Validated export shape of a Custom Component bundle
 * @example setRuntimeRegistries({ stages: { DefaultLogin: { component: Login, acceptedProps: [] } }, header: { component: Header, acceptedProps: ['journeyName'] } });
 */
export function setRuntimeRegistries(bundle: CustomComponentBundle) {
  runtimeRegistryStore.set({
    stages: bundle.stages ?? {},
    callbacks: bundle.callbacks ?? {},
    header: bundle.header ?? null,
    footer: bundle.footer ?? null,
  });
}

/**
 * @function resetRuntimeRegistries - Empties the runtime registries, restoring core behavior
 */
export function resetRuntimeRegistries() {
  runtimeRegistryStore.set(emptyRegistries);
}
