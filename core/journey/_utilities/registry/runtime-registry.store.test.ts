/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetRuntimeRegistries,
  runtimeRegistryStore,
  setRuntimeRegistries,
} from './runtime-registry.store';

import type { CustomRegistryEntry } from './registry.interfaces';

// Typed as the entry's component shape: a test fake only needs to be
// callable, and a bare `() => void` does not satisfy Svelte's Component type.
const fakeComponent = (() => {}) as unknown as CustomRegistryEntry['component'];
const entry = (props: string[] = []): CustomRegistryEntry => ({
  component: fakeComponent,
  acceptedProps: props,
});

describe('runtime registry store', () => {
  beforeEach(() => {
    resetRuntimeRegistries();
  });

  it('starts empty', () => {
    expect(get(runtimeRegistryStore)).toEqual({
      stages: {},
      callbacks: {},
      header: null,
      footer: null,
    });
  });

  it('replaces both registries on set', () => {
    setRuntimeRegistries({
      stages: { DefaultLogin: entry(['form']) },
      callbacks: { NameCallback: entry() },
    });

    const state = get(runtimeRegistryStore);
    expect(state.stages.DefaultLogin?.acceptedProps).toEqual(['form']);
    expect(state.callbacks.NameCallback?.component).toBe(fakeComponent);
  });

  it('stores singular header and footer entries', () => {
    const header = entry(['journeyName']);
    const footer = entry(['journeyName']);
    setRuntimeRegistries({ header, footer });

    expect(get(runtimeRegistryStore).header).toEqual(header);
    expect(get(runtimeRegistryStore).footer).toEqual(footer);
  });

  it('treats a missing registry key as empty and a missing wrapper as null', () => {
    setRuntimeRegistries({ stages: { Login: entry() }, header: entry() });

    expect(get(runtimeRegistryStore)).toEqual({
      stages: { Login: entry() },
      callbacks: {},
      header: entry(),
      footer: null,
    });
  });

  it('restores empty state on reset', () => {
    setRuntimeRegistries({ stages: { Login: entry() }, footer: entry() });
    resetRuntimeRegistries();

    expect(get(runtimeRegistryStore)).toEqual({
      stages: {},
      callbacks: {},
      header: null,
      footer: null,
    });
  });

  it('notifies subscribers on set', () => {
    const subscriber = vi.fn();
    const unsubscribe = runtimeRegistryStore.subscribe(subscriber);

    setRuntimeRegistries({ callbacks: { Name: entry() } });

    expect(subscriber).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
