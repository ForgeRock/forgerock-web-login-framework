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

import { loadCustomBundle } from './load-custom-bundle.effects';
import { resetRuntimeRegistries, runtimeRegistryStore } from './runtime-registry.store';

const fakeComponent = () => {};
const validEntry = { component: fakeComponent, acceptedProps: ['callback'] };

const importOk = (module: object) => async () => module;

const getRuntimeRegistries = () => get(runtimeRegistryStore);

describe('loadCustomBundle', () => {
  beforeEach(() => {
    resetRuntimeRegistries();
  });

  it('registers a valid bundle in the runtime registry and returns it', async () => {
    const bundle = {
      stages: { DefaultLogin: validEntry },
      callbacks: { NameCallback: validEntry },
    };

    const returned = await loadCustomBundle('bundle.js', {
      importModule: importOk(bundle),
    });

    expect(returned).toEqual({ ...bundle, header: undefined, footer: undefined });
    expect(getRuntimeRegistries()).toEqual({
      ...bundle,
      header: null,
      footer: null,
    });
  });

  it('accepts a callbacks-only bundle', async () => {
    await loadCustomBundle('bundle.js', {
      importModule: importOk({ callbacks: { NameCallback: validEntry } }),
    });

    expect(getRuntimeRegistries().callbacks.NameCallback).toEqual(validEntry);
    expect(getRuntimeRegistries().stages).toEqual({});
  });

  it('rejects a module with no registries and leaves the store unchanged', async () => {
    await expect(loadCustomBundle('bundle.js', { importModule: importOk({}) })).rejects.toThrow(
      /invalid export shape/,
    );

    expect(getRuntimeRegistries()).toEqual({
      stages: {},
      callbacks: {},
      header: null,
      footer: null,
    });
  });

  it('rejects an entry missing acceptedProps', async () => {
    await expect(
      loadCustomBundle('bundle.js', {
        importModule: importOk({ stages: { Login: { component: fakeComponent } } }),
      }),
    ).rejects.toThrow(/stages\.Login\.acceptedProps/);

    expect(getRuntimeRegistries().stages).toEqual({});
  });

  it('rejects an entry whose component is not a function', async () => {
    await expect(
      loadCustomBundle('bundle.js', {
        importModule: importOk({ stages: { Login: { component: 'nope', acceptedProps: [] } } }),
      }),
    ).rejects.toThrow(/component/);
  });

  it('rejects reserved registry keys without registering anything', async () => {
    // An object literal's `__proto__:` sets the prototype, not an own property —
    // but JSON.parse or defineProperty (how a real bundle's exports can be
    // produced) create the own property the guard must catch.
    const poisonedStages: Record<string, typeof validEntry> = { Login: validEntry };
    Object.defineProperty(poisonedStages, '__proto__', {
      value: validEntry,
      enumerable: true,
      configurable: true,
      writable: true,
    });

    await expect(
      loadCustomBundle('bundle.js', {
        importModule: importOk({ stages: poisonedStages }),
      }),
    ).rejects.toThrow(/reserved registry key/);

    expect(getRuntimeRegistries().stages).toEqual({});
  });

  it('wraps a failed module load in a single error naming the URL', async () => {
    await expect(
      loadCustomBundle('https://host/bundle.js', {
        importModule: async () => {
          throw new Error('404');
        },
      }),
    ).rejects.toThrow(
      /Failed to load Custom Component bundle from "https:\/\/host\/bundle\.js".*404/,
    );
  });

  it('passes the url through to the injected import', async () => {
    const importModule = vi.fn(async () => ({ callbacks: { Name: validEntry } }));

    await loadCustomBundle('/x/bundle.js', { importModule });

    expect(importModule).toHaveBeenCalledWith('/x/bundle.js');
  });

  it('accepts a wrappers-only bundle (header and footer, no registries)', async () => {
    const returned = await loadCustomBundle('bundle.js', {
      importModule: importOk({ header: validEntry, footer: validEntry }),
    });

    expect(returned.header).toEqual(validEntry);
    expect(returned.footer).toEqual(validEntry);
    expect(getRuntimeRegistries().header).toEqual(validEntry);
    expect(getRuntimeRegistries().stages).toEqual({});
  });

  it('rejects a wrapper entry with a bad shape', async () => {
    await expect(
      loadCustomBundle('bundle.js', {
        importModule: importOk({ header: { component: fakeComponent } }),
      }),
    ).rejects.toThrow(/header\.acceptedProps/);

    expect(getRuntimeRegistries().header).toBeNull();
  });

  it('rejects a bundle with none of the four exports', async () => {
    await expect(loadCustomBundle('bundle.js', { importModule: importOk({}) })).rejects.toThrow(
      /stages.*callbacks.*header.*footer/s,
    );
  });
});
