/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { Context, Data, Effect, Layer, Schema } from 'effect';

import { type ComponentArtifact, ComponentRepo, isSafeRelativePath } from './component-repo';

import type { ComponentRepoError } from './component-repo';

/**
 * Error emitted when a submitted component bundle cannot be decoded or contains an unsafe path.
 *
 * @throws {ComponentPublisherError} When the bundle is not valid JSON matching the expected file schema.
 */
export class ComponentPublisherError extends Data.TaggedError('ComponentPublisherError')<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Validates serialized component bundles and delegates persistence to {@link ComponentRepoService}.
 * Its error channel contains bundle-validation and repository-persistence failures.
 */
export interface ComponentPublisherService {
  /**
   * Validates and persists a serialized component bundle.
   *
   * @param bundle - JSON bundle containing component files.
   * @returns An effect that completes once all artifacts have been persisted.
   * @throws {ComponentPublisherError} When the bundle cannot be decoded or contains an unsafe path.
   * @throws {ComponentRepoError} When validated artifacts cannot be persisted.
   */
  readonly publishComponent: (
    bundle: string,
  ) => Effect.Effect<void, ComponentPublisherError | ComponentRepoError>;
}

/**
 * Service tag for publishing validated component bundles.
 */
const ComponentPublisherTag = Context.GenericTag<ComponentPublisherService>(
  '@login-app/ComponentPublisher',
);

/**
 * Service tag and layer for publishing validated component bundles.
 */
export const ComponentPublisher = Object.assign(ComponentPublisherTag, {
  layer: Layer.effect(
    ComponentPublisherTag,
    Effect.gen(function* () {
      const repo = yield* ComponentRepo;
      return ComponentPublisherTag.of({
        publishComponent: (bundle) =>
          parseBundle(bundle).pipe(Effect.flatMap((artifacts) => repo.saveArtifacts(artifacts))),
      });
    }),
  ),
});

const BundleFileSchema = Schema.Struct({
  path: Schema.String,
  content: Schema.String,
});

const BundleSchema = Schema.Struct({
  files: Schema.Array(BundleFileSchema),
});

type Bundle = Schema.Schema.Type<typeof BundleSchema>;

/**
 * Decodes a JSON bundle into repository artifacts and rejects every unsafe file path before persistence.
 *
 * @param bundle - JSON containing a `files` array of `{ path, content }` entries.
 * @returns Artifacts with validated relative paths.
 * @throws {ComponentPublisherError} When JSON/schema decoding fails or any path is unsafe.
 */
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
          () => new ComponentPublisherError({ message: `Bundle file at index ${index} has an unsafe path` }),
        ).pipe(Effect.map(({ path, content }) => ({ relPath: path, content }))),
      ),
    ),
  );

/**
 * Publishes a serialized component bundle through the publisher service in the current environment.
 *
 * @param bundle - JSON component bundle to validate and persist.
 * @returns An effect requiring {@link ComponentPublisherService}, which may fail with publisher or repository errors.
 */
export const publishComponent = (bundle: string) =>
  Effect.flatMap(ComponentPublisher, (publisher) => publisher.publishComponent(bundle));
