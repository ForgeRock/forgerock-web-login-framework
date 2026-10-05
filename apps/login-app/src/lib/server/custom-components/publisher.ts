/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { type Bundle, BundleSchema, PublishResponseSchema } from './api.schemas';
import { isSafeRelativePath } from './repo';

import type { ComponentArtifact, ComponentPublishResult, ComponentRepoFn } from './component.types';

/**
 * Validates serialized component bundles and delegates persistence to the component repository.
 *
 * @param repo - The artifact-saving function from {@link createComponentRepo}.
 * @returns A function that validates and persists a serialized bundle, returning failures as values.
 */
export const createComponentPublisher =
  (repo: ComponentRepoFn) =>
  async (bundle: string): Promise<ComponentPublishResult> => {
    let artifacts: ReadonlyArray<ComponentArtifact>;
    try {
      artifacts = parseBundle(bundle);
    } catch (cause) {
      return {
        success: false,
        error: { reason: 'Invalid', message: String(causeMessage(cause)), cause },
      };
    }
    try {
      await repo(artifacts);
      return { success: true, value: undefined };
    } catch (cause) {
      return {
        success: false,
        error: { reason: 'Storage', message: 'Unable to persist component bundle', cause },
      };
    }
  };

/** Extracts a message from an unknown thrown value. */
const causeMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'Bundle must be valid JSON';

/** Decodes a JSON bundle into repository artifacts, rejecting every unsafe file path. */
export const parseBundle = (bundle: string): ReadonlyArray<ComponentArtifact> => {
  let parsed: Bundle;
  try {
    parsed = BundleSchema.parse(JSON.parse(bundle));
  } catch (cause) {
    throw new Error('Bundle must be valid JSON', { cause });
  }
  return parsed.files.map(({ path, content }, index) => {
    if (!isSafeRelativePath(path)) {
      throw new Error(`Bundle file at index ${index} has an unsafe path`);
    }
    return { relPath: path, content };
  });
};

/** Serializes a publish request into the repository bundle format. */
export const publishBundle = (body: {
  code: string;
  files?: ReadonlyArray<{ path: string; content: string }>;
}): string =>
  JSON.stringify({ files: [...(body.files ?? []), { path: 'bundle.js', content: body.code }] });

/** Produces the fixed publish-success response after a bundle is persisted. */
export const publishResponse = (): Response =>
  Response.json(PublishResponseSchema.parse({ id: crypto.randomUUID(), url: '' }));
