/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { it } from '@effect/vitest';
import { describe, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'root',
  },
}));

import { Effect, Schema } from 'effect';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { ComponentRecordSchema } from './api.schemas';
import { Auth } from './auth/auth';
import { Publish } from './publish/publish';
import { ComponentApiLive } from './runtime';
import { Store } from './store/store';

import type { ComponentPublishFn } from './publish/publish';

/**
 * The only test that exercises the production composition graph. Unit tests for the
 * store, writer, and publisher build their own layers, so a broken ComponentApiLive
 * (a missing service in a Layer.provide chain) fails here and in e2e — nowhere else.
 * ComponentApiLive resolves config when its layer builds (not at module load), so the
 * test sets COMPONENT_CONFIG_DIR before each run instead of importing late.
 */

let repoDir: string;

beforeAll(async () => {
  repoDir = await mkdtemp(join(tmpdir(), 'runtime-'));
});

beforeEach(async () => {
  // ComponentApiLive resolves COMPONENT_CONFIG_DIR when its layer builds, so the
  // variable must be set before each test's Effect.provide, not at module load.
  process.env.COMPONENT_CONFIG_DIR = join(repoDir, 'config');
});

afterEach(async () => {
  delete process.env.COMPONENT_CONFIG_DIR;
});

afterAll(async () => {
  if (repoDir !== undefined) {
    await rm(repoDir, { recursive: true });
  }
});

describe('ComponentApiLive', () => {
  it.effect('resolves every handler service and lists records through the real graph', () =>
    Effect.gen(function* () {
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const publish = yield* Publish;
        const authenticate = yield* Auth;
        const listed = yield* store.list('callbacks');
        return [listed, typeof publish, typeof authenticate];
      });
      const result = yield* Effect.scoped(Effect.provide(program, ComponentApiLive));

      expect(result[0]).toEqual([]);
      expect(result[1]).toBe('function');
      expect(result[2]).toBe('function');
    }),
  );

  it.effect('persists a published bundle through the shared writer', () =>
    Effect.gen(function* () {
      yield* Effect.scoped(
        Effect.provide(
          Effect.flatMap(Publish, (publish: ComponentPublishFn) =>
            publish('{"files":[{"path":"components/x/a.json","content":"{}"}]}'),
          ),
          ComponentApiLive,
        ),
      );

      expect(
        yield* Effect.promise(() => readdir(join(repoDir, 'config', 'components', 'x'))),
      ).toEqual(['a.json']);
    }),
  );

  it.effect('lists records that exist in the repository', () =>
    Effect.gen(function* () {
      const callbacksDir = join(repoDir, 'config', 'callbacks');
      const record = Schema.encodeSync(Schema.parseJson(ComponentRecordSchema))({
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
      yield* Effect.promise(() => mkdir(callbacksDir, { recursive: true }));
      yield* Effect.promise(() =>
        writeFile(join(callbacksDir, 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0.json'), record),
      );

      const records = yield* Effect.scoped(
        Effect.provide(
          Effect.flatMap(Store, (store) => store.list('callbacks')),
          ComponentApiLive,
        ),
      );

      expect(records).toHaveLength(1);
      expect(records[0].meta.name).toBe('probe');
    }),
  );
});
