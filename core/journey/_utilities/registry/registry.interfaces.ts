/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import type { Component } from 'svelte';

/**
 * One custom component as registered by either source: the compile-time
 * registry generator (custom-registry.ts) or a runtime-loaded bundle.
 * `acceptedProps` is the list of props declared via `export let` — only these
 * are forwarded by the mapper.
 */
export interface CustomRegistryEntry {
  component: Component;
  acceptedProps: string[];
}

/**
 * The export shape a runtime Custom Component bundle must provide. All keys
 * are optional so a bundle may ship any subset. `stages`/`callbacks` are
 * name-keyed registries; `header`/`footer` are singular — the page renders
 * exactly one of each, so a bundle supplies the wrapper itself or leaves the
 * key out (the static wrapper file is the fallback).
 */
export interface CustomComponentBundle {
  stages?: Record<string, CustomRegistryEntry>;
  callbacks?: Record<string, CustomRegistryEntry>;
  header?: CustomRegistryEntry;
  footer?: CustomRegistryEntry;
}
