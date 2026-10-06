/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'root',
  },
}));

import { Effect, ManagedRuntime } from 'effect';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { Auth, Publish, Store } from './component.types';

import type { ComponentPublishFn } from './component.types';

/**
 * The only test that exercises the production composition graph. Unit tests for the
 * store, writer, and publisher build their own layers, so a broken ComponentApiLive
 * (a missing service in a Layer.provide chain) fails here and in e2e — nowhere else.
 */

let repoDir: string;
let runtime: ManagedRuntime.ManagedRuntime<Store | Publish | Auth, never>;

beforeAll(async () => {
  repoDir = await mkdtemp(join(tmpdir(), 'runtime-'));
  process.env.COMPONENT_CONFIG_DIR = join(repoDir, 'config');
  // The runtime module reads COMPONENT_CONFIG_DIR at load time; the dynamic import
  // (with this file's static imports not yet evaluated against it) is not needed
  // because env is set before this module's top-level imports finish — a static
  // import of ./runtime here would already have captured the env. Use resetModules
  // + dynamic import to evaluate the module after env is in place.
  vi.resetModules();
  const { ComponentApiLive } = await import('./runtime');
  runtime = ManagedRuntime.make(ComponentApiLive);
});

afterEach(async () => {
  delete process.env.COMPONENT_CONFIG_DIR;
});

afterAll(async () => {
  await runtime?.dispose();
  if (repoDir !== undefined) {
    await rm(repoDir, { recursive: true });
  }
});

describe('ComponentApiLive', () => {
  it('resolves every handler service and lists records through the real graph', async () => {
    const result = await runtime.runPromise(
      Effect.all([Store, Publish, Auth]).pipe(
        Effect.flatMap(([store, publish, authenticate]) =>
          Effect.all([
            store.list('callbacks'),
            Effect.sync(() => typeof publish),
            Effect.sync(() => typeof authenticate),
          ]),
        ),
      ),
    );

    expect(result[0]).toEqual([]);
    expect(result[1]).toBe('function');
    expect(result[2]).toBe('function');
  });

  it('persists a published bundle through the shared writer', async () => {
    await runtime.runPromise(
      Effect.flatMap(Publish, (publish: ComponentPublishFn) =>
        publish('{"files":[{"path":"components/x/a.json","content":"{}"}]}'),
      ),
    );

    expect(await readdir(join(repoDir, 'config', 'components', 'x'))).toEqual(['a.json']);
  });

  it('lists records that exist in the repository', async () => {
    const callbacksDir = join(repoDir, 'config', 'callbacks');
    const record = JSON.stringify({
      id: 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
      src: 'export const x = 1;',
      meta: {
        name: 'probe',
        displayName: 'Probe',
        publish: false,
        fromComponent: '',
        fromJson: '',
        createdDate: '2026-01-01T00:00:00.000Z',
        modifiedDate: '2026-01-01T00:00:00.000Z',
      },
    });
    await mkdir(callbacksDir, { recursive: true });
    await writeFile(join(callbacksDir, 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0.json'), record);

    const records = await runtime.runPromise(
      Effect.flatMap(Store, (store) => store.list('callbacks')),
    );

    expect(records).toHaveLength(1);
    expect(records[0].meta.name).toBe('probe');
  });
});
