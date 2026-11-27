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

const loadModule = async (manifestResponse: Response | null, loader: object) => {
  // A Response body can only be read once, so each fetch call gets a fresh Response.
  const makeResponse = (): Promise<Response | null> =>
    manifestResponse === null
      ? Promise.resolve(null)
      : manifestResponse
          .clone()
          .text()
          .then((text) => new Response(text, { status: manifestResponse.status }));
  const fetchMock = vi.fn(async () => {
    const response = await makeResponse();
    if (response === null) {
      throw new TypeError('Network error');
    }
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.doMock('$journey/_utilities/registry/load-custom-bundle.effects', () => loader);
  try {
    const effects = await import('./configure-custom-bundle.effects');
    const store = await import('$journey/_utilities/registry/runtime-registry.store');
    store.resetRuntimeRegistries();
    return {
      ...effects,
      resetRuntimeRegistries: store.resetRuntimeRegistries,
      registryState: () => get(store.runtimeRegistryStore),
      fetchMock,
    };
  } finally {
    vi.doUnmock('$journey/_utilities/registry/load-custom-bundle.effects');
  }
};

describe('configureCustomBundle', () => {
  beforeEach(() => {
    // Clear the cached module instance so each test's doMock of the loader applies
    // to a fresh import, and start every test from a clean fetch/registry state
    // (the reset itself runs on the per-test store instance inside loadModule).
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('lands on failed and loads nothing when the manifest is unreachable', async () => {
    const loader = { loadCustomBundle: vi.fn() };
    const {
      configureCustomBundle: configure,
      registryState,
      fetchMock,
    } = await loadModule(null, loader);

    configure();
    await vi.waitFor(() => expect(registryState().status).toBe('failed'));

    expect(fetchMock).toHaveBeenCalledWith('/api/components/manifest');
    expect(loader.loadCustomBundle).not.toHaveBeenCalled();
  });

  it('lands on failed and loads nothing when the manifest reports the API disabled', async () => {
    const loader = { loadCustomBundle: vi.fn() };
    const { configureCustomBundle: configure, registryState } = await loadModule(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
      loader,
    );

    configure();
    await vi.waitFor(() => expect(registryState().status).toBe('failed'));
    expect(loader.loadCustomBundle).not.toHaveBeenCalled();
  });

  it('resolves the bundle URL from the manifest, loads it, and lands on loaded', async () => {
    const bundle = { callbacks: {} };
    // Mirrors the real loader's contract: a successful load registers the bundle.
    const loader = {
      loadCustomBundle: vi.fn(async () => {
        const store = await import('$journey/_utilities/registry/runtime-registry.store');
        store.setRuntimeRegistries(bundle);
        return bundle;
      }),
    };
    const { configureCustomBundle: configure, registryState } = await loadModule(
      new Response(JSON.stringify({ componentsBundle: '/api/components/bundle' }), { status: 200 }),
      loader,
    );

    configure();
    await vi.waitFor(() => expect(registryState().status).toBe('loaded'));

    expect(loader.loadCustomBundle).toHaveBeenCalledWith('/api/components/bundle');
  });

  it('lands on failed when the manifest has no componentsBundle key', async () => {
    const loader = { loadCustomBundle: vi.fn() };
    const { configureCustomBundle: configure, registryState } = await loadModule(
      new Response(JSON.stringify({ unrelated: 'key' }), { status: 200 }),
      loader,
    );

    configure();
    await vi.waitFor(() => expect(registryState().status).toBe('failed'));
    expect(loader.loadCustomBundle).not.toHaveBeenCalled();
  });

  it('loads only once per page session (subsequent calls are no-ops)', async () => {
    const loader = {
      loadCustomBundle: vi.fn(async () => {
        const store = await import('$journey/_utilities/registry/runtime-registry.store');
        store.setRuntimeRegistries({ callbacks: {} });
        return { callbacks: {} };
      }),
    };
    const { configureCustomBundle: configure } = await loadModule(
      new Response(JSON.stringify({ componentsBundle: '/api/components/bundle' }), { status: 200 }),
      loader,
    );

    configure();
    configure();
    configure();

    await vi.waitFor(() => expect(loader.loadCustomBundle).toHaveBeenCalledTimes(1));
  });

  it('stays loading while the bundle load is pending and settles to loaded once it resolves', async () => {
    let releaseLoad!: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      releaseLoad = resolve;
    });
    const loader = {
      loadCustomBundle: vi.fn(async () => {
        await loadPromise;
        const store = await import('$journey/_utilities/registry/runtime-registry.store');
        store.setRuntimeRegistries({ callbacks: {} });
      }),
    };
    const { configureCustomBundle: configure, registryState } = await loadModule(
      new Response(JSON.stringify({ componentsBundle: '/api/components/bundle' }), { status: 200 }),
      loader,
    );

    configure();
    expect(registryState().status).toBe('loading');

    releaseLoad();
    await vi.waitFor(() => expect(registryState().status).toBe('loaded'));
  });
});
