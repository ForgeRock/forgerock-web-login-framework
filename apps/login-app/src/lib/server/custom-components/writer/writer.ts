/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { FileSystem, Path } from '@effect/platform';
import { Context, Data, DateTime, Effect, Either, Layer } from 'effect';

import { isSafeRelativePath } from './paths';

import type { ComponentArtifact, ComponentStoreConfig } from '../shared';

/** A failure raised when a repository write cannot safely complete. */
export class ArtifactWriterError extends Data.TaggedError('ArtifactWriterError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A failure raised when a filesystem durability operation cannot complete. */
export class FileSyncError extends Data.TaggedError('FileSyncError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** The artifact writer service: validates and atomically persists component artifacts. */
export interface WriterService {
  readonly write: (
    artifacts: ReadonlyArray<ComponentArtifact>,
  ) => Effect.Effect<void, ArtifactWriterError>;
}

/** Service tag for durable component artifact persistence; layers provide implementations. */
export const Writer = Context.GenericTag<WriterService>('Writer');

/**
 * Synchronizes filesystem entries after writes and renames so acknowledged saves are
 * durable. Built on the platform `FileSystem` file handle (`open` + `sync`), which has
 * no path-level fsync of its own.
 */
export interface FileSyncService {
  readonly fsync: (path: string) => Effect.Effect<void, FileSyncError>;
}

export const FileSync = Context.GenericTag<FileSyncService>('FileSync');

/**
 * `fsync`s a file or directory through the platform `FileSystem` handle. `mapError` runs
 * inside `catchAllDefect` so a failed sync wins over a failing close, and a close failure
 * after a successful sync is reported instead of becoming a platform release defect.
 */
export const FileSyncLive: Layer.Layer<FileSyncService, never, FileSystem.FileSystem> =
  Layer.effect(
    FileSync,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      return {
        fsync: (path) =>
          Effect.scoped(
            fileSystem.open(path, { flag: 'r' }).pipe(Effect.flatMap((file) => file.sync)),
          ).pipe(
            Effect.mapError(
              (cause) => new FileSyncError({ message: `Unable to fsync ${path}`, cause }),
            ),
            Effect.catchAllDefect(
              (defect) =>
                new FileSyncError({
                  message: `Unable to close ${path} after fsync`,
                  cause: defect,
                }),
            ),
          ),
      };
    }),
  );

interface PreparedArtifact {
  readonly content: string;
  readonly directory: string;
  readonly finalPath: string;
  readonly normalizedPath: string;
  readonly tempPath: string;
}

/**
 * Persists component artifacts beneath the configured repository path.
 *
 * Every write validates the relative path first, writes and `fsync`s temporary files,
 * atomically renames them into place, then `fsync`s parent directories so successful
 * saves survive crashes. This honors the config-repo pipeline contract: config-saver
 * polls every 10 seconds and will commit whatever complete files it finds.
 *
 * @param config - Tracked config directory configuration.
 * @returns A layer providing the artifact writer, requiring the platform FileSystem and the fsync service.
 */
export const WriterLive = (
  config: ComponentStoreConfig,
): Layer.Layer<WriterService, never, FileSystem.FileSystem | Path.Path | FileSyncService> =>
  Layer.effect(
    Writer,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const fileSync = yield* FileSync;

      const trackedRoot = config.trackedRoot;

      /** Builds the staged-write plan for one artifact, failing on an unsafe path. */
      const prepareArtifact = (
        artifact: ComponentArtifact,
        index: number,
      ): Effect.Effect<PreparedArtifact, ArtifactWriterError> => {
        if (!isSafeRelativePath(artifact.relPath)) {
          return Effect.fail(
            new ArtifactWriterError({
              message: `Artifact ${index} has an unsafe component path: ${artifact.relPath}`,
            }),
          );
        }
        const finalPath = path.join(trackedRoot, artifact.relPath);
        const directory = finalPath.slice(0, finalPath.lastIndexOf('/'));
        const basename = artifact.relPath.slice(artifact.relPath.lastIndexOf('/') + 1);
        return Effect.map(DateTime.now, (now) => ({
          content: artifact.content,
          directory,
          finalPath,
          normalizedPath: artifact.relPath,
          tempPath: path.join(
            directory,
            `.${basename}.${DateTime.toEpochMillis(now)}.${Math.random()
              .toString(36)
              .slice(2)}.tmp`,
          ),
        }));
      };

      /** Finds the first artifact writing a path another artifact already claims. */
      const findDuplicatePath = (prepared: ReadonlyArray<PreparedArtifact>): string | undefined => {
        const seen = new Set<string>();
        return prepared.find((artifact) => seen.size === seen.add(artifact.normalizedPath).size)
          ?.normalizedPath;
      };

      /** Rejects symlink path segments to prevent cloned repositories from escaping the tracked subtree. */
      const ensureNoSymlink = (relPath: string): Effect.Effect<void, ArtifactWriterError> => {
        const probes = relPath
          .split('/')
          .reduce<string[]>(
            (parts, segment) => [...parts, [parts.at(-1) ?? trackedRoot, segment].join('/')],
            [trackedRoot],
          );
        return Effect.forEach(
          probes,
          (probe) =>
            Effect.flatMap(Effect.either(fileSystem.readLink(probe)), (result) =>
              Either.match(result, {
                onRight: () =>
                  Effect.fail(
                    new ArtifactWriterError({
                      message: `Component path must not traverse symlinks: ${probe}`,
                    }),
                  ),
                onLeft: (error) => {
                  const code = (error.cause as { code?: string } | undefined)?.code;
                  if (code === 'ENOENT' || code === 'EINVAL') {
                    return Effect.void;
                  }
                  return Effect.fail(
                    new ArtifactWriterError({
                      message: `Unable to inspect component path ${probe}`,
                      cause: error,
                    }),
                  );
                },
              }),
            ),
          { discard: true },
        );
      };

      /** Stages every artifact as a fsynced temporary file next to its final location. */
      const stageTempFiles = (
        prepared: ReadonlyArray<PreparedArtifact>,
      ): Effect.Effect<void, ArtifactWriterError> =>
        Effect.forEach(
          prepared,
          ({ content, directory, tempPath }) =>
            Effect.gen(function* () {
              yield* fileSystem.makeDirectory(directory, { recursive: true }).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail(
                      new ArtifactWriterError({
                        message: 'Unable to create component directory',
                        cause,
                      }),
                    ),
                  SystemError: (cause) =>
                    Effect.fail(
                      new ArtifactWriterError({
                        message: 'Unable to create component directory',
                        cause,
                      }),
                    ),
                }),
              );
              yield* fileSystem.writeFileString(tempPath, content).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail(
                      new ArtifactWriterError({
                        message: 'Unable to write temporary component file',
                        cause,
                      }),
                    ),
                  SystemError: (cause) =>
                    Effect.fail(
                      new ArtifactWriterError({
                        message: 'Unable to write temporary component file',
                        cause,
                      }),
                    ),
                }),
              );
              yield* fileSync
                .fsync(tempPath)
                .pipe(
                  Effect.catchTag('FileSyncError', (cause) =>
                    Effect.fail(
                      new ArtifactWriterError({ message: 'Unable to sync component file', cause }),
                    ),
                  ),
                );
            }),
          { discard: true },
        );

      /**
       * Files are staged before any rename, then renamed in artifact order. Each individual
       * replacement is atomic, but this is not a directory-swap transaction: a later rename
       * failure can leave earlier files replaced. Staged temporary files are removed when
       * staging or renaming fails, so no dotfiles are left for config-saver to commit.
       * Callers receive one bundle-level error.
       */
      const renameIntoPlace = (
        prepared: ReadonlyArray<PreparedArtifact>,
      ): Effect.Effect<void, ArtifactWriterError> =>
        Effect.forEach(
          prepared,
          ({ finalPath, tempPath }) =>
            fileSystem.rename(tempPath, finalPath).pipe(
              Effect.catchTags({
                BadArgument: (cause) =>
                  Effect.fail(
                    new ArtifactWriterError({
                      message: 'Unable to atomically replace component file',
                      cause,
                    }),
                  ),
                SystemError: (cause) =>
                  Effect.fail(
                    new ArtifactWriterError({
                      message: 'Unable to atomically replace component file',
                      cause,
                    }),
                  ),
              }),
            ),
          { discard: true },
        );

      /** Fsyncs every touched directory so acknowledged saves survive crashes. */
      const syncDirectories = (
        prepared: ReadonlyArray<PreparedArtifact>,
      ): Effect.Effect<void, ArtifactWriterError> => {
        const directories = [
          ...new Set(
            prepared.flatMap(({ directory }) => directoryChain(path, trackedRoot, directory)),
          ),
        ];
        return Effect.forEach(
          directories,
          (directory) =>
            fileSync.fsync(directory).pipe(
              Effect.catchTag('FileSyncError', (cause) =>
                Effect.fail(
                  new ArtifactWriterError({
                    message: 'Unable to sync component directory',
                    cause,
                  }),
                ),
              ),
            ),
          { discard: true },
        );
      };

      return {
        write: (artifacts) =>
          Effect.gen(function* () {
            const prepared = yield* Effect.forEach(artifacts, prepareArtifact);
            const duplicate = findDuplicatePath(prepared);
            if (duplicate !== undefined) {
              return yield* Effect.fail(
                new ArtifactWriterError({
                  message: `Duplicate component path at artifact ${duplicate}`,
                }),
              );
            }
            yield* Effect.forEach(
              prepared,
              ({ normalizedPath }) => ensureNoSymlink(normalizedPath),
              {
                discard: true,
              },
            );
            yield* stageTempFiles(prepared).pipe(
              Effect.onExit((exit) =>
                exit._tag === 'Failure'
                  ? Effect.forEach(
                      prepared,
                      ({ tempPath }) => Effect.ignore(fileSystem.remove(tempPath, { force: true })),
                      { discard: true },
                    )
                  : Effect.void,
              ),
            );
            yield* renameIntoPlace(prepared);
            yield* syncDirectories(prepared);
          }),
      };
    }),
  );

/** Lists a directory and each ancestor through the tracked root in sync order (deepest first). */
const directoryChain = (path: Path.Path, trackedRoot: string, directory: string) => {
  const relativeDirectory = directory.slice(trackedRoot.length).replace(/^\/+/, '');
  const directories = relativeDirectory
    ? relativeDirectory
        .split('/')
        .reduce<string[]>(
          (parts, segment) => [...parts, path.join(parts.at(-1) ?? trackedRoot, segment)],
          [trackedRoot],
        )
    : [trackedRoot];

  return [...directories].reverse();
};
