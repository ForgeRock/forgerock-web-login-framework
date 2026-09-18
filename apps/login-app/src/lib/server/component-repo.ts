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
import { type FileHandle,open } from 'node:fs/promises';

/**
 * Error emitted when component persistence cannot safely complete.
 *
 * @throws {ComponentRepoError} When a filesystem operation, including durability syncing, fails.
 */
export class ComponentRepoError extends Data.TaggedError('ComponentRepoError')<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Location of the repository root and its tracked component subtree.
 */
export interface ComponentRepoConfig {
  readonly repoDir: string;
  readonly trackedSubpath: string;
}

/**
 * Synchronizes filesystem entries after writes and renames so acknowledged saves are durable.
 */
export interface FileSyncService {
  readonly syncFile: (path: string) => Effect.Effect<void, ComponentRepoError>;
  readonly syncDirectory: (path: string) => Effect.Effect<void, ComponentRepoError>;
}

/**
 * Service tag for the filesystem durability operations required by component persistence.
 */
const FileSyncTag = Context.GenericTag<FileSyncService>('@login-app/FileSync');

/**
 * Service tag and layers for filesystem durability operations required by component persistence.
 */
export const FileSync = Object.assign(FileSyncTag, {
  /** Layer providing Node file and directory `fsync` operations for durable component saves. */
  layer: Layer.succeed(FileSyncTag, {
    syncFile: (path: string) => syncPath(path, 'r+', 'temporary component file'),
    syncDirectory: (path: string) => syncPath(path, 'r', 'component directory'),
  }),
  /** No-op layer for tests that do not need to verify durability syncing. */
  layerNoop: Layer.succeed(FileSyncTag, {
    syncFile: () => Effect.void,
    syncDirectory: () => Effect.void,
  }),
});

const withFileHandle = <A>(
  path: string,
  flags: string,
  use: (handle: FileHandle) => Effect.Effect<A, ComponentRepoError>,
): Effect.Effect<A, ComponentRepoError> =>
  Effect.acquireUseRelease(
    Effect.tryPromise({
      try: () => open(path, flags),
      catch: (cause) => new ComponentRepoError({ message: `Unable to open ${path}`, cause }),
    }),
    use,
    (handle) => Effect.promise(() => handle.close()).pipe(Effect.catchAll(() => Effect.void)),
  );

const syncPath = (
  path: string,
  flags: string,
  target: string,
): Effect.Effect<void, ComponentRepoError> =>
  withFileHandle(path, flags, (handle) =>
    Effect.tryPromise({
      try: () => handle.sync(),
      catch: (cause) => new ComponentRepoError({ message: `Unable to sync ${target}`, cause }),
    }),
  );

/**
 * A component file expressed relative to the configured tracked subtree.
 */
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
  /**
   * Saves one component artifact through the durable multi-artifact write pipeline.
   *
   * @param relPath - Safe path relative to the tracked subtree.
   * @param content - Complete content to write.
   * @returns An effect that completes after the file and parent directory have been synchronized.
   * @throws {ComponentRepoError} When path validation or filesystem persistence fails.
   */
  readonly saveComponent: (
    relPath: string,
    content: string,
  ) => Effect.Effect<void, ComponentRepoError>;
  /**
   * Validates and atomically replaces each artifact, synchronizing temporary files and directories.
   *
   * @param artifacts - Files to persist relative to the tracked subtree.
   * @returns An effect that completes after every artifact has been durably persisted.
   * @throws {ComponentRepoError} When a path is unsafe or a filesystem operation fails.
   */
  readonly saveArtifacts: (
    artifacts: ReadonlyArray<ComponentArtifact>,
  ) => Effect.Effect<void, ComponentRepoError>;
}

/**
 * Service tag for repository-backed component persistence.
 */
const ComponentRepoTag = Context.GenericTag<ComponentRepoService>('@login-app/ComponentRepo');

/**
 * Service tag and layer factory for repository-backed component persistence.
 */
export const ComponentRepo = Object.assign(ComponentRepoTag, {
  layer: (config: ComponentRepoConfig): Layer.Layer<ComponentRepoService, never, FileSystem.FileSystem | FileSyncService> =>
    makeComponentRepoLayer(config),
});

/**
 * Determines whether a bundle path is a non-empty, slash-delimited relative path safe to write.
 * Rejects absolute paths, Windows separators, empty segments, traversal segments, and `.git` segments.
 *
 * @param path - Untrusted path supplied by a component bundle.
 * @returns `true` only when the path stays within the configured tracked subtree.
 */
export const isSafeRelativePath = (path: string): boolean =>
  Predicate.isString(path) &&
  path.length > 0 &&
  !path.startsWith('/') &&
  !path.includes('\\') &&
  path.split('/').every((segment) => segment !== '..' && segment !== '.git' && segment !== '');

const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

/**
 * Builds a component repository layer for a configured repository subtree.
 * It validates every relative path before writing, writes and `fsync`s temporary files, atomically
 * renames them into place, then `fsync`s parent directories so successful saves survive crashes.
 *
 * @param config - Repository root and tracked subtree used for component artifacts.
 * @returns A layer that provides {@link ComponentRepoService} and requires filesystem and sync services.
 */
const makeComponentRepoLayer = (
  config: ComponentRepoConfig,
): Layer.Layer<ComponentRepoService, never, FileSystem.FileSystem | FileSyncService> =>
  Layer.effect(
    ComponentRepo,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const fileSync = yield* FileSync;

      const saveArtifacts = (artifacts: ReadonlyArray<ComponentArtifact>) =>
        Effect.gen(function* () {
          const prepared = yield* Effect.forEach(artifacts, (artifact) =>
            Effect.filterOrFail(
              Effect.succeed(artifact.relPath),
              isSafeRelativePath,
              () =>
                new ComponentRepoError({
                  message: 'Component paths must be non-empty relative paths without traversal or .git segments',
                }),
            ).pipe(
              Effect.map((normalizedPath) => {
                const finalPath = joinPath(config.repoDir, config.trackedSubpath, normalizedPath);
                const directory = finalPath.slice(0, finalPath.lastIndexOf('/'));
                const basename = normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1);

                return {
                  content: artifact.content,
                  directory,
                  finalPath,
                  tempPath: joinPath(
                    directory,
                    `.${basename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`,
                  ),
                };
              }),
            ),
          );

          yield* Effect.forEach(prepared, ({ content, directory, tempPath }) =>
            Effect.gen(function* () {
              yield* fileSystem.makeDirectory(directory, { recursive: true }).pipe(
                Effect.catchAll((cause) =>
                  Effect.fail(new ComponentRepoError({ message: 'Unable to create component directory', cause })),
                ),
              );
              yield* fileSystem.writeFileString(tempPath, content).pipe(
                Effect.catchAll((cause) =>
                  Effect.fail(new ComponentRepoError({ message: 'Unable to write temporary component file', cause })),
                ),
              );
              yield* fileSync.syncFile(tempPath);
            }),
          );
          yield* Effect.forEach(prepared, ({ finalPath, tempPath }) =>
            fileSystem.rename(tempPath, finalPath).pipe(
              Effect.catchAll((cause) =>
                Effect.fail(new ComponentRepoError({ message: 'Unable to atomically replace component file', cause })),
              ),
            ),
          );
          yield* Effect.forEach(
            [...new Set(prepared.map(({ directory }) => directory))],
            (directory) => fileSync.syncDirectory(directory),
          );
        });

      const saveComponent = (relPath: string, content: string) =>
        saveArtifacts([{ relPath, content }]);

      return { saveArtifacts, saveComponent };
    }),
  );

/**
 * Default repository layer configured by the `CONFIG_REPO_DIR` and `CONFIG_TRACKED_SUBPATH`
 * infrastructure contract with config-saver.
 */
export const componentRepoLayer = ComponentRepo.layer({
  repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
  trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
});

/**
 * Saves one component file through the repository service in the current Effect environment.
 *
 * @param relPath - Safe path relative to the configured tracked subtree.
 * @param content - Complete file content to persist.
 * @returns An effect requiring {@link ComponentRepoService} that may fail with {@link ComponentRepoError}.
 */
export const saveComponent = (relPath: string, content: string) =>
  Effect.flatMap(ComponentRepo, (repo) => repo.saveComponent(relPath, content));
