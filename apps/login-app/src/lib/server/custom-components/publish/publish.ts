/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data, Effect, Layer, Schema } from 'effect';

import { type Bundle, BundleSchema, PublishResponseSchema } from '../api.schemas';
import { type ComponentArtifact } from '../shared';
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

/** Validates and persists a serialized component bundle, failing with a tagged error. */
export type ComponentPublishFn = (bundle: string) => Effect.Effect<void, ComponentPublishError>;

/** Service tag for component bundle publication; layers provide implementations. */
export const Publish = Context.GenericTag<ComponentPublishFn>('Publish');

/**
 * Validates serialized component bundles and delegates persistence to the artifact writer.
 *
 * @returns A layer providing the publisher; the writer is captured at construction.
 */
export const PublishLive: Layer.Layer<ComponentPublishFn, never, ArtifactWriterFn> = Layer.effect(
  Publish,
  Effect.map(
    Writer,
    (writer) => (bundle: string) =>
      Effect.flatMap(parseBundle(bundle), (artifacts) =>
        Effect.mapError(
          writer(artifacts),
          (cause) =>
            new PublishStorageError({
              message: 'Unable to persist component bundle',
              cause,
            }),
        ),
      ),
  ),
);

/**
 * Decodes a JSON bundle into repository artifacts, rejecting every unsafe file path and
 * any duplicate path — including a client file that collides with the appended bundle entry —
 * so request-level mistakes fail with 400 before any repository I/O.
 */
export const parseBundle = (
  bundle: string,
): Effect.Effect<ReadonlyArray<ComponentArtifact>, ComponentPublishError> =>
  Schema.decodeUnknown(Schema.parseJson(BundleSchema))(bundle).pipe(
    Effect.mapError(
      (cause) => new PublishInvalidError({ message: 'Bundle must be valid JSON', cause }),
    ),
    Effect.flatMap((parsed: Bundle) => {
      const seen = new Set<string>();
      for (const { path } of parsed.files) {
        if (seen.has(path)) {
          return Effect.fail(
            new PublishInvalidError({ message: `Bundle file path is a duplicate: ${path}` }),
          );
        }
        seen.add(path);
      }
      return Effect.forEach(parsed.files, ({ path, content }, index) =>
        isSafeRelativePath(path)
          ? Effect.succeed({ relPath: path, content })
          : Effect.fail(
              new PublishInvalidError({
                message: `Bundle file at index ${index} has an unsafe path`,
              }),
            ),
      );
    }),
  );

export const BUNDLE_ENTRY_PATH = 'bundle.js';

/** Serializes a publish request into the repository bundle format defined by `BundleSchema`. */
export const publishBundle = (body: {
  code: string;
  files?: ReadonlyArray<{ path: string; content: string }>;
}): string =>
  Schema.encodeSync(Schema.parseJson(BundleSchema))({
    files: [...(body.files ?? []), { path: BUNDLE_ENTRY_PATH, content: body.code }],
  });

/** Produces the fixed publish-success response after a bundle is persisted. */
export const publishResponse = (): Response =>
  Response.json(Schema.encodeSync(PublishResponseSchema)({ id: crypto.randomUUID(), url: '' }), {
    headers: { 'cache-control': 'no-store' },
  });
