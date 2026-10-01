/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { Context, Data, Effect, Layer, Schema } from 'effect';

import { type Bundle, BundleSchema, PublishResponseSchema } from './api.schemas';
import { type ComponentArtifact, ComponentRepo, isSafeRelativePath } from './repo';

import type { PublishRequestSchema } from './api.schemas';
import type { FileSyncError } from './file-sync';
import type { ComponentRepoError } from './repo';

/** Error emitted when a submitted component bundle cannot be decoded or contains an unsafe path. */
export class ComponentPublisherError extends Data.TaggedError('ComponentPublisherError')<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Validates serialized component bundles and delegates persistence to {@link ComponentRepoService}.
 * Its error channel contains bundle-validation and repository-persistence failures.
 */
export interface ComponentPublisherService {
  /** Validates and persists a serialized component bundle. */
  readonly publishComponent: (
    bundle: string,
  ) => Effect.Effect<void, ComponentPublisherError | ComponentRepoError | FileSyncError>;
}

const ComponentPublisherTag = Context.GenericTag<ComponentPublisherService>(
  '@login-app/ComponentPublisher',
);

/** Service tag and layer for publishing validated component bundles. */
export const ComponentPublisher = Object.assign(ComponentPublisherTag, {
  /** Creates a publisher layer backed by the repository service. */
  layer: Layer.effect(
    ComponentPublisherTag,
    Effect.map(ComponentRepo, (repo) =>
      ComponentPublisherTag.of({
        publishComponent: (bundle) =>
          parseBundle(bundle).pipe(Effect.flatMap((artifacts) => repo.saveArtifacts(artifacts))),
      }),
    ),
  ),
});

/** Decodes a JSON bundle into repository artifacts, rejecting every unsafe file path. */
export const parseBundle = (
  bundle: string,
): Effect.Effect<ReadonlyArray<ComponentArtifact>, ComponentPublisherError> =>
  Schema.decodeUnknown(Schema.parseJson(BundleSchema))(bundle).pipe(
    Effect.catchAll((cause) =>
      Effect.fail(new ComponentPublisherError({ message: 'Bundle must be valid JSON', cause })),
    ),
    Effect.flatMap((parsed: Bundle) =>
      Effect.forEach(parsed.files, (file, index) =>
        Effect.filterOrFail(
          Effect.succeed(file),
          ({ path }) => isSafeRelativePath(path),
          () =>
            new ComponentPublisherError({
              message: `Bundle file at index ${index} has an unsafe path`,
            }),
        ).pipe(Effect.map(({ path, content }) => ({ relPath: path, content }))),
      ),
    ),
  );

/** Publishes a serialized component bundle through the publisher service in the current environment. */
export const publishComponent = (bundle: string) =>
  ComponentPublisher.pipe(Effect.flatMap((publisher) => publisher.publishComponent(bundle)));

/** Serializes a publish request into the repository bundle format. */
export const publishBundle = (body: Schema.Schema.Type<typeof PublishRequestSchema>): string =>
  JSON.stringify({ files: [...(body.files ?? []), { path: 'bundle.js', content: body.code }] });

/** Produces the fixed publish-success response after a bundle is persisted. */
export const publishResponse = (): Response =>
  Response.json(Schema.encodeSync(PublishResponseSchema)({ id: crypto.randomUUID(), url: '' }));
