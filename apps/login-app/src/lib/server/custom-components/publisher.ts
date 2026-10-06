/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Layer, Schema } from 'effect';

import { type Bundle, BundleSchema, PublishResponseSchema } from './api.schemas';
import { isSafeRelativePath } from './artifact-writer';
import { ComponentPublishError, Publish, Writer } from './component.types';

import type { ArtifactWriterFn, ComponentArtifact } from './component.types';

/**
 * Validates serialized component bundles and delegates persistence to the artifact writer.
 *
 * @returns A layer providing the publisher, requiring the writer service.
 */
export const PublishLive: Layer.Layer<Publish, never, Writer> = Layer.effect(
  Publish,
  Effect.flatMap(Writer, (writer) =>
    Effect.succeed(
      (bundle: string): Effect.Effect<void, ComponentPublishError> => publish(bundle, writer),
    ),
  ),
);

/** Validates a bundle and persists it through the writer, failing with a tagged error. */
const publish = (
  bundle: string,
  writer: ArtifactWriterFn,
): Effect.Effect<void, ComponentPublishError> =>
  Effect.flatMap(parseBundle(bundle), (artifacts) =>
    Effect.mapError(
      writer(artifacts),
      (cause) =>
        new ComponentPublishError({
          reason: 'Storage',
          message: 'Unable to persist component bundle',
          cause,
        }),
    ),
  );

/** Decodes a JSON bundle into repository artifacts, rejecting every unsafe file path. */
export const parseBundle = (
  bundle: string,
): Effect.Effect<ReadonlyArray<ComponentArtifact>, ComponentPublishError> =>
  Effect.try({
    try: () => Schema.decodeUnknownSync(BundleSchema)(JSON.parse(bundle)),
    catch: (cause) =>
      new ComponentPublishError({ reason: 'Invalid', message: 'Bundle must be valid JSON', cause }),
  }).pipe(
    Effect.flatMap((parsed: Bundle) =>
      Effect.forEach(parsed.files, ({ path, content }, index) =>
        isSafeRelativePath(path)
          ? Effect.succeed({ relPath: path, content })
          : Effect.fail(
              new ComponentPublishError({
                reason: 'Invalid',
                message: `Bundle file at index ${index} has an unsafe path`,
              }),
            ),
      ),
    ),
  );

export const BUNDLE_ENTRY_PATH = 'bundle.js';

/** Serializes a publish request into the repository bundle format. */
export const publishBundle = (body: {
  code: string;
  files?: ReadonlyArray<{ path: string; content: string }>;
}): string =>
  JSON.stringify({
    files: [...(body.files ?? []), { path: BUNDLE_ENTRY_PATH, content: body.code }],
  });

/** Produces the fixed publish-success response after a bundle is persisted. */
export const publishResponse = (): Response =>
  Response.json(Schema.encodeSync(PublishResponseSchema)({ id: crypto.randomUUID(), url: '' }), {
    headers: { 'cache-control': 'no-store' },
  });
