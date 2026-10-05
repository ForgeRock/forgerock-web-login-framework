/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Schema } from 'effect';

import { type Bundle, BundleSchema, PublishResponseSchema } from './api.schemas';
import { ComponentPublishError } from './component.types';
import { isSafeRelativePath } from './repo';

import type { ComponentArtifact, ComponentPublishFn, ComponentRepoFn } from './component.types';

/**
 * Validates serialized component bundles and delegates persistence to the component repository.
 *
 * @param repo - The artifact-saving function from {@link createComponentRepo}.
 * @returns A function that validates and persists a serialized bundle, failing with a tagged error.
 */
export const createComponentPublisher =
  (repo: ComponentRepoFn): ComponentPublishFn =>
  (bundle) =>
    Effect.flatMap(parseBundle(bundle), (artifacts) =>
      Effect.mapError(
        repo(artifacts),
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
      Effect.try({
        try: () =>
          parsed.files.map(({ path, content }, index) => {
            if (!isSafeRelativePath(path)) {
              throw new ComponentPublishError({
                reason: 'Invalid',
                message: `Bundle file at index ${index} has an unsafe path`,
              });
            }
            return { relPath: path, content };
          }),
        catch: (cause) => cause as ComponentPublishError,
      }),
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
  Response.json(Schema.encodeSync(PublishResponseSchema)({ id: crypto.randomUUID(), url: '' }));
