/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { derived, writable } from 'svelte/store';

import type { Readable, Writable } from 'svelte/store';

import type { CustomComponentBundle, CustomRegistryEntry } from './registry.interfaces';

/** Lifecycle of the runtime bundle load: `'loading'` marks the in-flight window between kick and settlement. */
export type RuntimeBundleStatus = 'idle' | 'loading' | 'loaded' | 'failed';

/** The empty state the mappers and pages see until a runtime bundle loads. */
const emptyRegistries: RuntimeRegistryState = {
  status: 'idle',
  stages: {},
  callbacks: {},
  header: null,
  footer: null,
};

/**
 * Runtime registry state: the bundle load lifecycle plus name-keyed component
 * registries and singular wrapper slots.
 */
export interface RuntimeRegistryState {
  /** Lifecycle of the runtime bundle load; `'loaded'` once bundle contents are live. */
  status: RuntimeBundleStatus;
  callbacks: Record<string, CustomRegistryEntry>;
  footer: CustomRegistryEntry | null;
  header: CustomRegistryEntry | null;
  stages: Record<string, CustomRegistryEntry>;
}

/**
 * Runtime-populated custom components from an external bundle, consulted by the
 * mappers (stages/callbacks) and the page wrappers (header/footer) before the
 * compile-time sources. Empty with `status: 'idle'` until the bundle loader
 * transitions the status and (on success) fills the registries.
 */
export const runtimeRegistryStore: Writable<RuntimeRegistryState> = writable(emptyRegistries);

/** True once the bundle load settled (loaded or failed) — pages may start journeys. */
export const bundleSettled: Readable<boolean> = derived(
  runtimeRegistryStore,
  ($state) => $state.status === 'loaded' || $state.status === 'failed',
);

/**
 * @function startBundleLoad - Marks the load in-flight. Must run synchronously at
 * kick time: it is the re-entry guard for back-to-back `configureCustomBundle` calls.
 */
export function startBundleLoad() {
  runtimeRegistryStore.update((state) => ({ ...state, status: 'loading' }));
}

/**
 * @function setRuntimeRegistries - Replaces the runtime registries with the validated contents of a loaded bundle and settles the lifecycle to `'loaded'`
 * @param {object} bundle - Validated export shape of a Custom Component bundle
 * @example setRuntimeRegistries({ stages: { DefaultLogin: { component: Login, acceptedProps: [] } }, header: { component: Header, acceptedProps: ['journeyName'] } });
 */
export function setRuntimeRegistries(bundle: CustomComponentBundle) {
  runtimeRegistryStore.update((state) => ({
    ...state,
    status: 'loaded',
    stages: bundle.stages ?? {},
    callbacks: bundle.callbacks ?? {},
    header: bundle.header ?? null,
    footer: bundle.footer ?? null,
  }));
}

/**
 * @function failBundleLoad - Marks the bundle load as failed; registries are left untouched and core components render
 */
export function failBundleLoad() {
  runtimeRegistryStore.update((state) => ({ ...state, status: 'failed' }));
}

/**
 * @function resetRuntimeRegistries - Empties the runtime registries, restoring core behavior
 */
export function resetRuntimeRegistries() {
  runtimeRegistryStore.set(emptyRegistries);
}
