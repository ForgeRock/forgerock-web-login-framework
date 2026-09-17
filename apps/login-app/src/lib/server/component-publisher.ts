/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { Context, Data, Effect, Layer, Schema } from 'effect';

import {
  type ComponentArtifact,
  ComponentRepo,
  type ComponentRepoService,
  isSafeRelativePath,
} from './component-repo';

import type { ComponentRepoError } from './component-repo';

export class ComponentPublisherError extends Data.TaggedError('ComponentPublisherError')<{
  message: string;
  cause?: unknown;
}> {}

export interface ComponentPublisherService {
  readonly publishComponent: (
    bundle: string,
  ) => Effect.Effect<void, ComponentPublisherError | ComponentRepoError>;
}

export const ComponentPublisher = Context.GenericTag<ComponentPublisherService>(
  '@login-app/ComponentPublisher',
);

const BundleFileSchema = Schema.Struct({
  path: Schema.String,
  content: Schema.String,
});

const BundleSchema = Schema.Struct({
  files: Schema.Array(BundleFileSchema),
});

type Bundle = Schema.Schema.Type<typeof BundleSchema>;

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

export const ComponentPublisherLive: Layer.Layer<ComponentPublisherService, never, ComponentRepoService> =
  Layer.effect(
    ComponentPublisher,
    Effect.gen(function* () {
      const repo = yield* ComponentRepo;
      return ComponentPublisher.of({
        publishComponent: (bundle) =>
          parseBundle(bundle).pipe(Effect.flatMap((artifacts) => repo.saveArtifacts(artifacts))),
      });
    }),
  );

export const publishComponent = (bundle: string) =>
  Effect.flatMap(ComponentPublisher, (publisher) => publisher.publishComponent(bundle));
