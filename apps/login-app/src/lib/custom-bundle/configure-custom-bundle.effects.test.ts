/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetRuntimeRegistry = async () => {
  const { resetRuntimeRegistries } = await import(
    '$journey/_utilities/registry/runtime-registry.store'
  );
  resetRuntimeRegistries();
};

const loadModule = async (publicEnv: Record<string, string>, loader: object) => {
  vi.doMock('$env/dynamic/public', () => ({ env: publicEnv }));
  vi.doMock('$env/dynamic/private', () => ({ env: publicEnv }));
  vi.doMock('$journey/_utilities/registry/load-custom-bundle.effects', () => loader);
  try {
    return await import('./configure-custom-bundle.effects');
  } finally {
    vi.doUnmock('$env/dynamic/public');
    vi.doUnmock('$env/dynamic/private');
    vi.doUnmock('$journey/_utilities/registry/load-custom-bundle.effects');
  }
};

describe('configureCustomBundle', () => {
  beforeEach(async () => {
    // Clear the cached module instance so each test's doMock of the env and
    // loader applies to a fresh import.
    vi.resetModules();
    await resetRuntimeRegistry();
  });

  it('returns null and loads nothing when the env var is unset', async () => {
    const loader = { loadCustomBundle: vi.fn() };
    const { configureCustomBundle: load } = await loadModule({}, loader);

    await expect(load()).resolves.toBeNull();
    expect(loader.loadCustomBundle).not.toHaveBeenCalled();
  });

  it('loads the bundle from the env URL', async () => {
    const bundle = { callbacks: {} };
    const loader = { loadCustomBundle: vi.fn(async () => bundle) };
    const { configureCustomBundle: load } = await loadModule(
      { PUBLIC_COMPONENT_BUNDLE_URL: 'https://host/custom/bundle.js' },
      loader,
    );

    await expect(load()).resolves.toBe(bundle);
    expect(loader.loadCustomBundle).toHaveBeenCalledWith('https://host/custom/bundle.js');
  });

  it('loads only once per page session (subsequent calls reuse the promise)', async () => {
    const loader = {
      loadCustomBundle: vi.fn(async () => ({ callbacks: {} })),
    };
    const { configureCustomBundle: load } = await loadModule(
      { PUBLIC_COMPONENT_BUNDLE_URL: 'https://host/custom/bundle.js' },
      loader,
    );

    await load();
    await load();

    expect(loader.loadCustomBundle).toHaveBeenCalledTimes(1);
  });

  it('logs a failed load, returns null, and retries on the next call', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const loader = {
      loadCustomBundle: vi
        .fn()
        .mockRejectedValueOnce(new Error('Failed to load Custom Component bundle'))
        .mockResolvedValueOnce({ callbacks: {} }),
    };
    const { configureCustomBundle: load } = await loadModule(
      { PUBLIC_COMPONENT_BUNDLE_URL: 'https://host/custom/bundle.js' },
      loader,
    );

    await expect(load()).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to load'));
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('[login-app]'));

    await expect(load()).resolves.toEqual({ callbacks: {} });
    consoleError.mockRestore();
  });
});
