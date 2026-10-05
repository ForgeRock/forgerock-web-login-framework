/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { Context, Data, Effect, Layer, Schema } from 'effect';

import { type Bundle, BundleSchema } from './component-api.schemas';
import { type ComponentArtifact, ComponentRepo, isSafeRelativePath } from './component-repo';

import type { ComponentRepoError } from './component-repo';

/**
 * Represents an invalid component bundle submitted for publication.
 *
 * **When to use**
 *
 * Use in the error channel when bundle JSON cannot be decoded or an artifact path is unsafe.
 *
 * @category errors
 */
export class ComponentPublisherError extends Data.TaggedError('ComponentPublisherError')<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Defines component bundle publication operations.
 *
 * **When to use**
 *
 * Use to validate a serialized bundle before delegating durable persistence to
 * {@link ComponentRepoService}.
 *
 * @category services
 */
export interface ComponentPublisherService {
  /**
   * Validates and persists a serialized component bundle.
   *
   * @param bundle - JSON bundle containing component files.
   * @returns An effect that completes once all artifacts have been persisted.
   * @throws {ComponentPublisherError} When the bundle cannot be decoded or contains an unsafe path.
   * @throws {ComponentRepoError} When validated artifacts cannot be persisted.
   *
   * @category internal
   */
  readonly publishComponent: (
    bundle: string,
  ) => Effect.Effect<void, ComponentPublisherError | ComponentRepoError>;
}

/**
 * Identifies the component bundle publication service in an Effect environment.
 *
 * @category services
 */
const ComponentPublisherTag = Context.GenericTag<ComponentPublisherService>(
  '@login-app/ComponentPublisher',
);

/**
 * Provides the component bundle publication service.
 *
 * **Example** (Publishing through a provided layer)
 *
 * ```ts
 * const program = publishComponent('{"files":[]}')
 * const result = program.pipe(Effect.provide(ComponentPublisher.layer))
 * ```
 *
 * @see {@link publishComponent} for accessing the service from an Effect environment.
 * @category layers
 */
export const ComponentPublisher = Object.assign(ComponentPublisherTag, {
  /**
   * Creates a publisher layer backed by the repository service.
   *
   * @returns A layer requiring {@link ComponentRepoService}.
   *
   * @category internal
   */
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

/**
 * Decodes a JSON bundle into repository artifacts with validated relative paths.
 *
 * **When to use**
 *
 * Use before persistence to reject malformed JSON and unsafe artifact paths.
 *
 * **Example** (Decoding a single artifact)
 *
 * ```ts
 * const artifacts = yield* parseBundle('{"files":[{"path":"bundle.js","content":"export {}"}]}')
 * ```
 *
 * @see {@link isSafeRelativePath} for the path safety policy.
 * @category parsing
 *
 * @param bundle - JSON containing `files` entries with `path` and `content`.
 * @returns An effect yielding artifacts with validated relative paths.
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
          () =>
            new ComponentPublisherError({
              message: `Bundle file at index ${index} has an unsafe path`,
            }),
        ).pipe(Effect.map(({ path, content }) => ({ relPath: path, content }))),
      ),
    ),
  );

/**
 * Publishes a serialized component bundle through the current Effect environment.
 *
 * **When to use**
 *
 * Use from an application boundary that provides {@link ComponentPublisher}.
 *
 * @see {@link parseBundle} for validation without persistence.
 * @category operations
 *
 * @param bundle - The JSON component bundle to validate and persist.
 * @returns An effect requiring {@link ComponentPublisherService}.
 */
export const publishComponent = (bundle: string) =>
  ComponentPublisher.pipe(Effect.flatMap((publisher) => publisher.publishComponent(bundle)));
