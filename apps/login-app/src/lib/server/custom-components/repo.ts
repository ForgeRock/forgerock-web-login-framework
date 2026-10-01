/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FileSystem } from '@effect/platform';
import { Context, Data, Effect, Layer, Predicate } from 'effect';
import { lstat } from 'node:fs/promises';

import { FileSync, type FileSyncError, type FileSyncService } from './file-sync';

/** Error emitted when component persistence cannot safely complete (filesystem or sync failure). */
export class ComponentRepoError extends Data.TaggedError('ComponentRepoError')<{
  message: string;
  cause?: unknown;
}> {}

/** Location of the repository root and its tracked component subtree. */
export interface ComponentRepoConfig {
  readonly repoDir: string;
  readonly trackedSubpath: string;
}

/** A component file expressed relative to the configured tracked subtree. */
export interface ComponentArtifact {
  readonly relPath: string;
  readonly content: string;
}

/**
 * Persists component artifacts beneath the configured repository path.
 *
 * Every operation may fail with {@link ComponentRepoError}; its implementation also requires
 * `FileSystem.FileSystem` and {@link FileSyncService} to create durable atomic replacements.
 */
export interface ComponentRepoService {
  /** Validates and atomically replaces each artifact, synchronizing temporary files and directories. */
  readonly saveArtifacts: (
    artifacts: ReadonlyArray<ComponentArtifact>,
  ) => Effect.Effect<void, ComponentRepoError | FileSyncError>;
}

/** Service tag and layer factory for repository-backed component persistence. */
const ComponentRepoTag = Context.GenericTag<ComponentRepoService>('@login-app/ComponentRepo');

export const ComponentRepo = Object.assign(ComponentRepoTag, {
  /** Creates a layer persisting artifacts beneath the configured repository subtree. */
  layer: (
    config: ComponentRepoConfig,
  ): Layer.Layer<ComponentRepoService, never, FileSystem.FileSystem | FileSyncService> =>
    makeComponentRepoLayer(config),
});

/**
 * Determines whether a bundle path is safe to write. Rejects absolute paths, Windows
 * separators, empty segments, traversal segments, and `.git` segments.
 */
export const isSafeRelativePath = (path: string): boolean =>
  Predicate.isString(path) &&
  path.length > 0 &&
  !path.startsWith('/') &&
  !path.includes('\u0000') &&
  !path.includes('\\') &&
  !/^[a-zA-Z]:/.test(path) &&
  path.split('/').every((segment) => segment !== '..' && segment !== '.git' && segment !== '');

/** Joins path segments with one slash between normalized boundaries. */
const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

const componentRepoError = (message: string, cause: unknown) =>
  new ComponentRepoError({ message, cause });

/** Fails with a tagged repository error when the inner effect fails, preserving its cause. */
const orRepoError =
  (message: string) =>
  <A, R>(effect: Effect.Effect<A, unknown, R>): Effect.Effect<A, ComponentRepoError, R> =>
    Effect.catchAll(effect, (cause) => Effect.fail(componentRepoError(message, cause)));

/** Rejects symlink path segments to prevent cloned repositories from escaping the tracked subtree. */
const ensureNoSymlink = (trackedRoot: string, relPath: string) =>
  Effect.forEach(
    relPath
      .split('/')
      .reduce<ReadonlyArray<string>>(
        (paths, segment) => [...paths, joinPath(paths.at(-1) ?? trackedRoot, segment)],
        [trackedRoot],
      ),
    (path) =>
      Effect.tryPromise({
        try: () => lstat(path),
        catch: (cause) => cause,
      }).pipe(
        Effect.matchEffect({
          onFailure: (cause) =>
            typeof cause === 'object' &&
            cause !== null &&
            'code' in cause &&
            cause.code === 'ENOENT'
              ? Effect.void
              : Effect.fail(componentRepoError(`Unable to inspect component path ${path}`, cause)),
          onSuccess: (stats) =>
            stats.isSymbolicLink()
              ? Effect.fail(
                  new ComponentRepoError({
                    message: `Component path must not traverse symlinks: ${path}`,
                  }),
                )
              : Effect.void,
        }),
      ),
  );

/** Lists a directory and each ancestor through the tracked root in sync order (deepest first). */
const directoryChain = (trackedRoot: string, directory: string): ReadonlyArray<string> => {
  const relativeDirectory = directory.slice(trackedRoot.length).replace(/^\/+/, '');
  const directories = relativeDirectory
    ? relativeDirectory
        .split('/')
        .reduce<ReadonlyArray<string>>(
          (paths, segment) => [...paths, joinPath(paths.at(-1) ?? trackedRoot, segment)],
          [trackedRoot],
        )
    : [trackedRoot];

  return [...directories].reverse();
};

/**
 * Builds the repository layer. It validates every relative path before writing, writes and
 * `fsync`s temporary files, atomically renames them into place, then `fsync`s parent
 * directories so successful saves survive crashes.
 */
const makeComponentRepoLayer = (
  config: ComponentRepoConfig,
): Layer.Layer<ComponentRepoService, never, FileSystem.FileSystem | FileSyncService> =>
  Layer.effect(
    ComponentRepo,
    Effect.map(Effect.all([FileSystem.FileSystem, FileSync]), ([fileSystem, fileSync]) => {
      const saveArtifacts = (artifacts: ReadonlyArray<ComponentArtifact>) => {
        const trackedRoot = joinPath(config.repoDir, config.trackedSubpath);
        const prepared = Effect.forEach(artifacts, (artifact, index) =>
          Effect.filterOrFail(
            Effect.succeed(artifact.relPath),
            isSafeRelativePath,
            () =>
              new ComponentRepoError({
                message: `Artifact ${index} has an unsafe component path: ${artifact.relPath}`,
              }),
          ).pipe(
            Effect.map((normalizedPath) => {
              const finalPath = joinPath(trackedRoot, normalizedPath);
              const directory = finalPath.slice(0, finalPath.lastIndexOf('/'));
              const basename = normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1);

              return {
                content: artifact.content,
                directory,
                finalPath,
                normalizedPath,
                tempPath: joinPath(
                  directory,
                  `.${basename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`,
                ),
              };
            }),
          ),
        );
        /** Rejects duplicate artifact paths; saving the same file twice in one bundle is a caller bug. */
        const rejectDuplicatePaths = (
          preparedArtifacts: ReadonlyArray<{
            content: string;
            directory: string;
            finalPath: string;
            normalizedPath: string;
            tempPath: string;
          }>,
        ): Effect.Effect<
          ReadonlyArray<{
            content: string;
            directory: string;
            finalPath: string;
            normalizedPath: string;
            tempPath: string;
          }>,
          ComponentRepoError
        > => {
          const paths = new Set<string>();
          for (const artifact of preparedArtifacts) {
            if (paths.has(artifact.normalizedPath)) {
              return Effect.fail(
                new ComponentRepoError({
                  message: `Duplicate component path at artifact ${artifact.normalizedPath}`,
                }),
              );
            }
            paths.add(artifact.normalizedPath);
          }
          return Effect.succeed(preparedArtifacts);
        };
        return prepared.pipe(
          Effect.flatMap(rejectDuplicatePaths),
          Effect.flatMap((preparedArtifacts) =>
            Effect.forEach(preparedArtifacts, ({ normalizedPath }) =>
              ensureNoSymlink(trackedRoot, normalizedPath),
            ).pipe(Effect.as(preparedArtifacts)),
          ),
          Effect.flatMap((staged) =>
            Effect.forEach(staged, ({ content, directory, tempPath }) =>
              orRepoError('Unable to create component directory')(
                fileSystem.makeDirectory(directory, { recursive: true }),
              ).pipe(
                Effect.flatMap(() =>
                  orRepoError('Unable to write temporary component file')(
                    fileSystem.writeFileString(tempPath, content),
                  ),
                ),
                Effect.flatMap(() => fileSync.syncFile(tempPath)),
              ),
            ).pipe(Effect.as(staged)),
          ),
          /**
           * Files are staged before any rename, then renamed in artifact order. Each individual
           * replacement is atomic, but this is not a directory-swap transaction: a later rename
           * failure can leave earlier files replaced. Callers receive one bundle-level error.
           */
          Effect.flatMap((staged) =>
            Effect.forEach(staged, ({ finalPath, tempPath }) =>
              orRepoError('Unable to atomically replace component file')(
                fileSystem.rename(tempPath, finalPath),
              ),
            ).pipe(Effect.as(staged)),
          ),
          Effect.flatMap((staged) =>
            Effect.forEach(
              [
                ...new Set(
                  staged.flatMap(({ directory }) => directoryChain(trackedRoot, directory)),
                ),
              ],
              (directory) => fileSync.syncDirectory(directory),
            ),
          ),
          Effect.asVoid,
        );
      };

      return { saveArtifacts };
    }),
  );
