/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data, Effect, Layer } from 'effect';

import { type PublishRequest } from '../api.schemas';
import { type ComponentLogger, Log } from '../shared';
import { isSafeRelativePath } from '../writer/paths';
import { Writer } from '../writer/writer';

import type { ArtifactWriterFn } from '../writer/writer';

/** A component publication failure raised when a bundle is malformed or unsafe. */
export class PublishInvalidError extends Data.TaggedError('PublishInvalidError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A component publication failure raised when the bundle cannot be persisted. */
export class PublishStorageError extends Data.TaggedError('PublishStorageError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A component publication failure carried on the Effect error channel. */
export type ComponentPublishError = PublishInvalidError | PublishStorageError;

/** The component publication service: validates a request and persists its artifacts. */
export interface PublishService {
  readonly publish: (body: PublishRequest) => Effect.Effect<void, ComponentPublishError>;
}

/** Service tag for component bundle publication; layers provide implementations. */
export const Publish = Context.GenericTag<PublishService>('Publish');

export const BUNDLE_ENTRY_PATH = 'bundle.js';

/**
 * Validates component publication requests and delegates persistence to the artifact
 * writer. A request is rejected in full — never partially published — when any file path
 * is unsafe or duplicated, and each rejection is logged for visibility.
 *
 * @returns A layer providing the publisher; the writer and logger are captured at construction.
 */
export const PublishLive: Layer.Layer<PublishService, never, ArtifactWriterFn | ComponentLogger> =
  Layer.effect(
    Publish,
    Effect.gen(function* () {
      const writer = yield* Writer;
      const log = yield* Log;

      /** Fails the request, logging the rejection so repeated offenders are visible. */
      const reject = (message: string): Effect.Effect<never, PublishInvalidError> => {
        log.warn('[components] publish rejected', { detail: message });
        return Effect.fail(new PublishInvalidError({ message }));
      };

      /** Rejects duplicated file paths, including a client file that collides with the bundle entry. */
      const rejectDuplicatePaths = (files: PublishRequest['files']) => {
        const seen = new Set<string>();
        for (const { path } of files) {
          if (seen.has(path)) {
            return reject(`Bundle file path is a duplicate: ${path}`);
          }
          seen.add(path);
        }
        return Effect.void;
      };

      /** Maps validated files to repository artifacts, rejecting unsafe paths. */
      const toArtifacts = (files: PublishRequest['files']) =>
        Effect.forEach(files, ({ path, content }, index) =>
          isSafeRelativePath(path)
            ? Effect.succeed({ relPath: path, content })
            : reject(`Bundle file at index ${index} has an unsafe path`),
        );

      return {
        publish: (body) =>
          Effect.gen(function* () {
            const files = [...(body.files ?? []), { path: BUNDLE_ENTRY_PATH, content: body.code }];
            yield* rejectDuplicatePaths(files);
            const artifacts = yield* toArtifacts(files);
            return yield* Effect.catchTag(writer.write(artifacts), 'ArtifactWriterError', (cause) =>
              Effect.fail(
                new PublishStorageError({
                  message: 'Unable to persist component bundle',
                  cause,
                }),
              ),
            );
          }),
      };
    }),
  );

/** Produces the fixed publish-success response after a bundle is persisted. */
export const publishResponse = (): Response =>
  Response.json({ id: crypto.randomUUID(), url: '' }, { headers: { 'cache-control': 'no-store' } });
