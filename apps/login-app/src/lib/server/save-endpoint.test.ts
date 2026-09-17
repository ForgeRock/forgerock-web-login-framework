/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { ComponentPublisherLive } from '$lib/server/component-publisher';
import { type ComponentArtifact,ComponentRepo, ComponentRepoError } from '$lib/server/component-repo';
import { publishComponentBundle } from './save-endpoint';

const publishedArtifacts: ComponentArtifact[][] = [];

const testRuntime = Layer.provide(
  ComponentPublisherLive,
  Layer.succeed(ComponentRepo, {
    saveComponent: () => Effect.void,
    saveArtifacts: (artifacts) =>
      Effect.sync(() => {
        publishedArtifacts.push([...artifacts]);
      }),
  }),
);

describe('POST /api/save', () => {
  it.effect('accepts a valid bundle and returns no content', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        '{"files":[{"path":"journeys/login.json","content":"{}"}]}',
        testRuntime,
      );

      expect(response.status).toBe(204);
      expect(publishedArtifacts.pop()).toEqual([{ relPath: 'journeys/login.json', content: '{}' }]);
    }),
  );

  it.effect('returns a client error for malformed bundles', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle('not json', testRuntime);

      expect(response.status).toBe(400);
      expect(yield* Effect.promise(() => response.json())).toEqual({ error: 'Bundle must be valid JSON' });
    }),
  );

  it.effect('returns a server error when persistence fails', () =>
    Effect.gen(function* () {
      const failingRuntime = Layer.provide(
        ComponentPublisherLive,
        Layer.succeed(ComponentRepo, {
          saveComponent: () => Effect.void,
          saveArtifacts: () => Effect.fail(new ComponentRepoError({ message: 'Unable to save bundle' })),
        }),
      );
      const response = yield* publishComponentBundle(
        '{"files":[{"path":"journeys/login.json","content":"{}"}]}',
        failingRuntime,
      );

      expect(response.status).toBe(500);
      expect(yield* Effect.promise(() => response.json())).toEqual({ error: 'Unable to save bundle' });
    }),
  );
});
