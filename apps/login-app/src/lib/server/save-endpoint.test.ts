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

import { ComponentPublisher } from '$lib/server/component-publisher';
import {
  type ComponentArtifact,
  ComponentRepo,
  ComponentRepoError,
} from '$lib/server/component-repo';
import {
  encodeSaveEndpointResponse,
  isJsonContentType,
  MAX_COMPONENT_BUNDLE_SIZE,
  publishComponentBundle,
} from './save-endpoint';

const publishedArtifacts: ComponentArtifact[][] = [];

const testRuntime = Layer.provide(
  ComponentPublisher.layer,
  Layer.succeed(ComponentRepo, {
    saveComponent: () => Effect.void,
    saveArtifacts: (artifacts) =>
      Effect.sync(() => {
        publishedArtifacts.push([...artifacts]);
      }),
  }),
);

const bundleRequest = (body: string, headers: HeadersInit = {}) =>
  new Request('http://localhost/api/save', {
    body,
    headers: { 'content-type': 'application/json', ...headers },
    method: 'POST',
  });

describe('POST /api/save', () => {
  it.effect('accepts a valid bundle and returns no content', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        bundleRequest('{"files":[{"path":"journeys/login.json","content":"{}"}]}'),
        { runtime: testRuntime },
      );

      expect(response.status).toBe(204);
      expect(publishedArtifacts.pop()).toEqual([{ relPath: 'journeys/login.json', content: '{}' }]);
    }),
  );

  it.effect('returns a client error for malformed bundles', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(bundleRequest('not json'), {
        runtime: testRuntime,
      });

      expect(response.status).toBe(400);
      expect(yield* Effect.tryPromise(() => response.json())).toEqual({
        error: 'Bundle must be valid JSON',
      });
    }),
  );

  it.effect('returns a server error when persistence fails', () =>
    Effect.gen(function* () {
      const failingRuntime = Layer.provide(
        ComponentPublisher.layer,
        Layer.succeed(ComponentRepo, {
          saveComponent: () => Effect.void,
          saveArtifacts: () =>
            Effect.fail(new ComponentRepoError({ message: 'Unable to save bundle' })),
        }),
      );
      const response = yield* publishComponentBundle(
        bundleRequest('{"files":[{"path":"journeys/login.json","content":"{}"}]}'),
        { runtime: failingRuntime },
      );

      expect(response.status).toBe(500);
      expect(yield* Effect.tryPromise(() => response.json())).toEqual({
        error: 'Unable to save bundle',
      });
    }),
  );

  it.effect('rejects a declared component bundle larger than 1 MiB', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        bundleRequest('{}', { 'content-length': String(MAX_COMPONENT_BUNDLE_SIZE + 1) }),
        { runtime: testRuntime },
      );

      expect(response.status).toBe(413);
    }),
  );

  it.effect('rejects a component bundle larger than 1 MiB without Content-Length', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        bundleRequest('x'.repeat(MAX_COMPONENT_BUNDLE_SIZE + 1)),
        { runtime: testRuntime },
      );

      expect(response.status).toBe(413);
    }),
  );

  it.effect('rejects requests without an application/json content type', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        bundleRequest('{}', { 'content-type': 'text/plain' }),
        {
          runtime: testRuntime,
        },
      );

      expect(response.status).toBe(415);
    }),
  );

  it.effect('accepts application/json with a charset parameter', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        bundleRequest('{"files":[]}', { 'content-type': 'application/json; charset=utf-8' }),
        { runtime: testRuntime },
      );

      expect(response.status).toBe(204);
    }),
  );

  it.effect('rejects missing and invalid bearer tokens when configured', () =>
    Effect.gen(function* () {
      const missing = yield* publishComponentBundle(bundleRequest('{"files":[]}'), {
        runtime: testRuntime,
        token: 'secret',
      });
      const wrong = yield* publishComponentBundle(
        bundleRequest('{"files":[]}', { authorization: 'Bearer wrong' }),
        {
          runtime: testRuntime,
          token: 'secret',
        },
      );

      expect(missing.status).toBe(401);
      expect(wrong.status).toBe(401);
    }),
  );

  it.effect('accepts a correct bearer token when configured', () =>
    Effect.gen(function* () {
      const response = yield* publishComponentBundle(
        bundleRequest('{"files":[]}', { authorization: 'Bearer secret' }),
        {
          runtime: testRuntime,
          token: 'secret',
        },
      );

      expect(response.status).toBe(204);
    }),
  );

  it.effect('encodes tagged response variants through the shared response union', () =>
    Effect.gen(function* () {
      const response = encodeSaveEndpointResponse({
        status: 415,
        body: { error: 'Content-Type must be application/json' },
      });

      expect(response.status).toBe(415);
      expect(yield* Effect.tryPromise(() => response.json())).toEqual({
        error: 'Content-Type must be application/json',
      });
    }),
  );

  it.effect('recognizes only JSON content types', () =>
    Effect.sync(() => {
      expect(isJsonContentType('application/json')).toBe(true);
      expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
      expect(isJsonContentType('text/json')).toBe(false);
      expect(isJsonContentType(null)).toBe(false);
    }),
  );
});
