/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data, Effect, Layer } from 'effect';

import { type PublishRequest } from '../api/api.schemas';
import { Writer } from '../writer/writer';

import type { WriterService } from '../writer/writer';

/** A component publication failure raised when the bundle cannot be persisted. */
export class PublishStorageError extends Data.TaggedError('PublishStorageError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** The component publication service: persists the bundle through the artifact writer. */
export interface PublishService {
  readonly publish: (body: PublishRequest) => Effect.Effect<void, PublishStorageError>;
}

/** Service tag for component bundle publication; layers provide implementations. */
export const Publish = Context.GenericTag<PublishService>('Publish');

export const BUNDLE_ENTRY_PATH = 'bundle.js';

/**
 * Persists the bundle's entry file through the artifact writer. The entry path is a
 * compile-time constant, so there is nothing to validate — persistence is the only
 * failure mode, and the request is rejected in full, never partially published.
 *
 * @returns A layer providing the publisher; the writer is captured at construction.
 */
export const PublishLive: Layer.Layer<PublishService, never, WriterService> = Layer.effect(
  Publish,
  Effect.gen(function* () {
    const writer = yield* Writer;

    return {
      publish: (body) =>
        Effect.catchTag(
          writer.write([{ relPath: BUNDLE_ENTRY_PATH, content: body.code }]),
          'ArtifactWriterError',
          (cause) =>
            Effect.fail(
              new PublishStorageError({
                message: 'Unable to persist component bundle',
                cause,
              }),
            ),
        ),
    };
  }),
);
