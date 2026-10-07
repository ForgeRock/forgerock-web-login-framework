/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { FileSystem, Path } from '@effect/platform';
import { Context, Data, Effect, Layer } from 'effect';

import { isSafeRelativePath } from './paths';

import type { ComponentArtifact, ComponentStoreConfig } from '../shared';

/** A failure raised when a repository write cannot safely complete. */
export class ArtifactWriterError extends Data.TaggedError('ArtifactWriterError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** Validates and atomically persists component artifacts; fails with a tagged error. */
export type ArtifactWriterFn = (
  artifacts: ReadonlyArray<ComponentArtifact>,
) => Effect.Effect<void, ArtifactWriterError>;

/** Service tag for durable component artifact persistence; layers provide implementations. */
export const Writer = Context.GenericTag<ArtifactWriterFn>('Writer');

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
): Layer.Layer<ArtifactWriterFn, never, FileSystem.FileSystem | Path.Path | FileSyncService> =>
  Layer.effect(
    Writer,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const fileSync = yield* FileSync;

      return (
        artifacts: ReadonlyArray<ComponentArtifact>,
      ): Effect.Effect<void, ArtifactWriterError> =>
        Effect.gen(function* () {
          const trackedRoot = config.trackedRoot;
          const prepared = yield* Effect.flatMap(
            prepareArtifacts(path, trackedRoot)(artifacts),
            rejectDuplicatePaths,
          );
          yield* Effect.forEach(prepared, ({ normalizedPath }) =>
            ensureNoSymlink(fileSystem, trackedRoot, normalizedPath),
          );
          yield* Effect.gen(function* () {
            yield* stageTempFiles(fileSystem, fileSync)(prepared);
            yield* renameIntoPlace(fileSystem)(prepared);
          }).pipe(
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
          yield* syncDirectories(path, trackedRoot, fileSync)(prepared);
        });
    }),
  );

/**
 * A failure raised when a filesystem durability operation cannot complete.
 */
export class FileSyncError extends Data.TaggedError('FileSyncError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

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
          Effect.catchAllDefect(
            Effect.mapError(
              Effect.scoped(
                fileSystem.open(path, { flag: 'r' }).pipe(Effect.flatMap((file) => file.sync)),
              ),
              (cause) => new FileSyncError({ message: `Unable to fsync ${path}`, cause }),
            ),
            (defect) =>
              new FileSyncError({ message: `Unable to close ${path} after fsync`, cause: defect }),
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

/** Validates every artifact path and computes its write plan, failing on the first unsafe path. */
const prepareArtifacts =
  (path: Path.Path, trackedRoot: string) => (artifacts: ReadonlyArray<ComponentArtifact>) =>
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
        const finalPath = path.join(trackedRoot, artifact.relPath);
        const directory = finalPath.slice(0, finalPath.lastIndexOf('/'));
        const basename = artifact.relPath.slice(artifact.relPath.lastIndexOf('/') + 1);
        return Effect.succeed({
          content: artifact.content,
          directory,
          finalPath,
          normalizedPath: artifact.relPath,
          tempPath: path.join(
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

/**
 * Rejects symlink path segments to prevent cloned repositories from escaping the tracked
 * subtree. Uses `readLink`, which succeeds exactly on symlinks (including dangling ones):
 * a success fails the probe, `ENOENT` and `EINVAL` mean "missing" and "not a symlink",
 * and any other platform error fails closed.
 */
const ensureNoSymlink = (fileSystem: FileSystem.FileSystem, trackedRoot: string, relPath: string) =>
  Effect.forEach(
    relPath
      .split('/')
      .reduce<string[]>(
        (parts, segment) => [...parts, [parts.at(-1) ?? trackedRoot, segment].join('/')],
        [trackedRoot],
      ),
    (probe) =>
      Effect.flatMap(Effect.either(fileSystem.readLink(probe)), (result) => {
        if (result._tag === 'Right') {
          return Effect.fail(
            new ArtifactWriterError({
              message: `Component path must not traverse symlinks: ${probe}`,
            }),
          );
        }
        const code = (result.left.cause as { code?: string } | undefined)?.code;
        if (code === 'ENOENT' || code === 'EINVAL') {
          return Effect.void;
        }
        return Effect.fail(
          new ArtifactWriterError({
            message: `Unable to inspect component path ${probe}`,
            cause: result.left,
          }),
        );
      }),
    { discard: true },
  );

/** Stages every artifact as a fsynced temporary file next to its final location. */
const stageTempFiles =
  (fileSystem: FileSystem.FileSystem, fileSync: FileSyncService) =>
  (prepared: ReadonlyArray<PreparedArtifact>) =>
    Effect.forEach(
      prepared,
      ({ content, directory, tempPath }) =>
        Effect.gen(function* () {
          yield* fileSystem.makeDirectory(directory, { recursive: true }).pipe(
            Effect.mapError(
              (cause) =>
                new ArtifactWriterError({
                  message: 'Unable to create component directory',
                  cause,
                }),
            ),
          );
          yield* fileSystem.writeFileString(tempPath, content).pipe(
            Effect.mapError(
              (cause) =>
                new ArtifactWriterError({
                  message: 'Unable to write temporary component file',
                  cause,
                }),
            ),
          );
          yield* Effect.mapError(
            fileSync.fsync(tempPath),
            (cause) => new ArtifactWriterError({ message: 'Unable to sync component file', cause }),
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
const renameIntoPlace =
  (fileSystem: FileSystem.FileSystem) => (prepared: ReadonlyArray<PreparedArtifact>) =>
    Effect.forEach(
      prepared,
      ({ finalPath, tempPath }) =>
        fileSystem.rename(tempPath, finalPath).pipe(
          Effect.mapError(
            (cause) =>
              new ArtifactWriterError({
                message: 'Unable to atomically replace component file',
                cause,
              }),
          ),
        ),
      { discard: true },
    );

/** Fsyncs every touched directory so acknowledged saves survive crashes. */
const syncDirectories =
  (path: Path.Path, trackedRoot: string, fileSync: FileSyncService) =>
  (prepared: ReadonlyArray<PreparedArtifact>) =>
    Effect.forEach(
      [
        ...new Set(
          prepared.flatMap(({ directory }) => directoryChain(path, trackedRoot, directory)),
        ),
      ],
      (directory) =>
        Effect.mapError(
          fileSync.fsync(directory),
          (cause) =>
            new ArtifactWriterError({ message: 'Unable to sync component directory', cause }),
        ),
      { discard: true },
    );
