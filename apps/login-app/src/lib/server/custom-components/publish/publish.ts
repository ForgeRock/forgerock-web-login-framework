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
import { authOrigin } from '../auth/auth';
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

/** The committed pointer file naming the latest bundle location, as Justin's publish contract. */
export const BUNDLE_MANIFEST_PATH = 'manifest.json';

/**
 * Persists the bundle and its manifest pointer through the artifact writer, in one
 * atomic batch: `{ bundle.js, manifest.json }` — both or neither. The pointer holds
 * the bundle location the manifest endpoint serves; today the same-origin app URL,
 * the GCS object URL once bucket delivery lands (IAM-12024).
 *
 * @returns A layer providing the publisher; the writer is captured at construction.
 */
export const PublishLive: Layer.Layer<PublishService, never, WriterService> = Layer.effect(
  Publish,
  Effect.gen(function* () {
    const writer = yield* Writer;

    return {
      publish: (body) =>
        Effect.map(authOrigin, (origin) =>
          origin ? new URL(`/${BUNDLE_ENTRY_PATH}`, origin).toString() : `/${BUNDLE_ENTRY_PATH}`,
        ).pipe(
          Effect.flatMap((bundleUrl) =>
            writer.write([
              { relPath: BUNDLE_ENTRY_PATH, content: body.code },
              {
                relPath: BUNDLE_MANIFEST_PATH,
                content: JSON.stringify({ componentsBundle: bundleUrl }),
              },
            ]),
          ),
          Effect.catchTag('ArtifactWriterError', (cause) =>
            Effect.fail(
              new PublishStorageError({
                message: 'Unable to persist component bundle',
                cause,
              }),
            ),
          ),
        ),
    };
  }),
);
