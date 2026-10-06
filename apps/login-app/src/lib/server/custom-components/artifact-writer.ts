/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';
import { lstat, mkdir, rename, writeFile } from 'node:fs/promises';

import { ArtifactWriterError } from './component.types';

import type { ArtifactWriterConfig, ComponentArtifact, FileSyncService } from './component.types';

interface PreparedArtifact {
  readonly content: string;
  readonly directory: string;
  readonly finalPath: string;
  readonly normalizedPath: string;
  readonly tempPath: string;
}

/** Joins path segments with one slash between normalized boundaries. */
export const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

/**
 * Determines whether a bundle path is safe to write. Rejects absolute paths, Windows
 * separators, empty segments, traversal segments, and `.git` segments.
 */
export const isSafeRelativePath = (path: string): boolean =>
  typeof path === 'string' &&
  path.length > 0 &&
  !path.startsWith('/') &&
  !path.includes('\u0000') &&
  !path.includes('\\') &&
  !/^[a-zA-Z]:/.test(path) &&
  path.split('/').every((segment) => segment !== '..' && segment !== '.git' && segment !== '');

/** Rejects symlink path segments to prevent cloned repositories from escaping the tracked subtree. */
const ensureNoSymlink = async (trackedRoot: string, relPath: string): Promise<void> => {
  const paths = relPath
    .split('/')
    .reduce<string[]>(
      (parts, segment) => [...parts, joinPath(parts.at(-1) ?? trackedRoot, segment)],
      [trackedRoot],
    );
  for (const path of paths) {
    let stats;
    try {
      stats = await lstat(path);
    } catch (cause) {
      if (
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        cause.code === 'ENOENT'
      ) {
        continue;
      }
      throw new Error(`Unable to inspect component path ${path}`, { cause });
    }
    if (stats.isSymbolicLink()) {
      throw new Error(`Component path must not traverse symlinks: ${path}`);
    }
  }
};

/** Lists a directory and each ancestor through the tracked root in sync order (deepest first). */
const directoryChain = (trackedRoot: string, directory: string): ReadonlyArray<string> => {
  const relativeDirectory = directory.slice(trackedRoot.length).replace(/^\/+/, '');
  const directories = relativeDirectory
    ? relativeDirectory
        .split('/')
        .reduce<string[]>(
          (parts, segment) => [...parts, joinPath(parts.at(-1) ?? trackedRoot, segment)],
          [trackedRoot],
        )
    : [trackedRoot];

  return [...directories].reverse();
};

/** Validates every artifact path and computes its write plan, failing on the first unsafe path. */
const prepareArtifacts = (trackedRoot: string) => (artifacts: ReadonlyArray<ComponentArtifact>) =>
  Effect.forEach(
    artifacts,
    (artifact, index) => {
      if (!isSafeRelativePath(artifact.relPath)) {
        return Effect.fail(
          new ArtifactWriterError({
            message: `Artifact ${index} has an unsafe component path: ${artifact.relPath}`,
          }),
        );
      }
      const finalPath = joinPath(trackedRoot, artifact.relPath);
      const directory = finalPath.slice(0, finalPath.lastIndexOf('/'));
      const basename = artifact.relPath.slice(artifact.relPath.lastIndexOf('/') + 1);
      return Effect.succeed({
        content: artifact.content,
        directory,
        finalPath,
        normalizedPath: artifact.relPath,
        tempPath: joinPath(
          directory,
          `.${basename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`,
        ),
      });
    },
    { discard: false },
  );

/** Rejects a bundle that writes the same path twice; saving a duplicate is a caller bug. */
const rejectDuplicatePaths = (prepared: ReadonlyArray<PreparedArtifact>) => {
  const paths = new Set<string>();
  for (const artifact of prepared) {
    if (paths.has(artifact.normalizedPath)) {
      return Effect.fail(
        new ArtifactWriterError({
          message: `Duplicate component path at artifact ${artifact.normalizedPath}`,
        }),
      );
    }
    paths.add(artifact.normalizedPath);
  }
  return Effect.succeed(prepared);
};

/** Fails when any path segment is an existing symlink. */
const checkSymlinks = (trackedRoot: string) => (prepared: ReadonlyArray<PreparedArtifact>) =>
  Effect.forEach(
    prepared,
    ({ normalizedPath }) =>
      Effect.tryPromise({
        try: () => ensureNoSymlink(trackedRoot, normalizedPath),
        catch: (cause) =>
          cause instanceof ArtifactWriterError
            ? cause
            : new ArtifactWriterError({
                message: 'Unable to inspect component path',
                cause,
              }),
      }),
    { discard: true },
  );

/** Stages every artifact as a fsynced temporary file next to its final location. */
const stageTempFiles = (fileSync: FileSyncService) => (prepared: ReadonlyArray<PreparedArtifact>) =>
  Effect.forEach(
    prepared,
    ({ content, directory, tempPath }) =>
      Effect.tryPromise({
        try: async () => {
          await mkdir(directory, { recursive: true });
          await writeFile(tempPath, content);
        },
        catch: (cause) =>
          cause instanceof Error && cause.message.includes('write')
            ? new ArtifactWriterError({
                message: 'Unable to write temporary component file',
                cause,
              })
            : new ArtifactWriterError({
                message: 'Unable to create component directory',
                cause,
              }),
      }).pipe(
        Effect.flatMap(() =>
          Effect.mapError(
            fileSync.fsync(tempPath),
            (cause) => new ArtifactWriterError({ message: 'Unable to sync component file', cause }),
          ),
        ),
      ),
    { discard: true },
  );

/**
 * Files are staged before any rename, then renamed in artifact order. Each individual
 * replacement is atomic, but this is not a directory-swap transaction: a later rename
 * failure can leave earlier files replaced. Callers receive one bundle-level error.
 */
const renameIntoPlace = (prepared: ReadonlyArray<PreparedArtifact>) =>
  Effect.forEach(
    prepared,
    ({ finalPath, tempPath }) =>
      Effect.tryPromise({
        try: () => rename(tempPath, finalPath),
        catch: (cause) =>
          new ArtifactWriterError({
            message: 'Unable to atomically replace component file',
            cause,
          }),
      }),
    { discard: true },
  );

/** Fsyncs every touched directory so acknowledged saves survive crashes. */
const syncDirectories =
  (trackedRoot: string, fileSync: FileSyncService) => (prepared: ReadonlyArray<PreparedArtifact>) =>
    Effect.forEach(
      [...new Set(prepared.flatMap(({ directory }) => directoryChain(trackedRoot, directory)))],
      (directory) =>
        Effect.mapError(
          fileSync.fsync(directory),
          (cause) =>
            new ArtifactWriterError({ message: 'Unable to sync component directory', cause }),
        ),
      { discard: true },
    );

/**
 * Persists component artifacts beneath the configured repository path.
 *
 * Every write validates the relative path first, writes and `fsync`s temporary files,
 * atomically renames them into place, then `fsync`s parent directories so successful
 * saves survive crashes. This honors the config-repo pipeline contract: config-saver
 * polls every 10 seconds and will commit whatever complete files it finds.
 *
 * @param config - Repository root and tracked subtree configuration.
 * @param fileSync - Durability synchronization service.
 * @returns A function that validates and atomically replaces each artifact.
 */
export const createArtifactWriter =
  (config: ArtifactWriterConfig, fileSync: FileSyncService) =>
  (artifacts: ReadonlyArray<ComponentArtifact>): Effect.Effect<void, ArtifactWriterError> => {
    const trackedRoot = joinPath(config.repoDir, config.trackedSubpath);
    return prepareArtifacts(trackedRoot)(artifacts).pipe(
      Effect.flatMap(rejectDuplicatePaths),
      Effect.flatMap((prepared) => checkSymlinks(trackedRoot)(prepared).pipe(Effect.as(prepared))),
      Effect.flatMap((prepared) => stageTempFiles(fileSync)(prepared).pipe(Effect.as(prepared))),
      Effect.flatMap((prepared) => renameIntoPlace(prepared).pipe(Effect.as(prepared))),
      Effect.flatMap((prepared) => syncDirectories(trackedRoot, fileSync)(prepared)),
      Effect.asVoid,
    );
  };
