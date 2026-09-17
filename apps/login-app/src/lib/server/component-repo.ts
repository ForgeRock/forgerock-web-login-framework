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

export class ComponentRepoError extends Data.TaggedError('ComponentRepoError')<{
  message: string;
  cause?: unknown;
}> {}

export interface ComponentRepoConfig {
  readonly repoDir: string;
  readonly trackedSubpath: string;
}

export interface FileSyncService {
  readonly syncFile: (path: string) => Effect.Effect<void, ComponentRepoError>;
  readonly syncDirectory: (path: string) => Effect.Effect<void, ComponentRepoError>;
}

export const FileSync = Context.GenericTag<FileSyncService>('@login-app/FileSync');

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

export const FileSyncLive: Layer.Layer<FileSyncService> = Layer.succeed(FileSync, {
  syncFile: (path) => syncPath(path, 'r+', 'temporary component file'),
  syncDirectory: (path) => syncPath(path, 'r', 'component directory'),
});

export interface ComponentArtifact {
  readonly relPath: string;
  readonly content: string;
}

export interface ComponentRepoService {
  readonly saveComponent: (
    relPath: string,
    content: string,
  ) => Effect.Effect<void, ComponentRepoError>;
  readonly saveArtifacts: (
    artifacts: ReadonlyArray<ComponentArtifact>,
  ) => Effect.Effect<void, ComponentRepoError>;
}

export const ComponentRepo = Context.GenericTag<ComponentRepoService>('@login-app/ComponentRepo');

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

export const makeComponentRepoLive = (
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

// These environment variable names are an infrastructure contract with config-saver.
export const ComponentRepoLive = makeComponentRepoLive({
  repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
  trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
});

export const saveComponent = (relPath: string, content: string) =>
  Effect.flatMap(ComponentRepo, (repo) => repo.saveComponent(relPath, content));
