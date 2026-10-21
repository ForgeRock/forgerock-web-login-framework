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

import { componentConfigDir } from '../settings';
import { FileSync } from './file-sync';
import { catchFsErrors } from './fs-errors';
import { isSafeRelativePath } from './paths';

import type { FileSyncService } from './file-sync';

/** A failure raised when a repository write cannot safely complete. */
export class ArtifactWriterError extends Data.TaggedError('ArtifactWriterError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A component file expressed relative to the configured config directory. */
export interface ComponentArtifact {
  readonly relPath: string;
  readonly content: string;
}

/** The artifact writer service: validates and atomically persists component artifacts. */
export interface WriterService {
  readonly write: (
    artifacts: ReadonlyArray<ComponentArtifact>,
  ) => Effect.Effect<void, ArtifactWriterError>;
}

/** Service tag for durable component artifact persistence; layers provide implementations. */
export const Writer = Context.GenericTag<WriterService>('Writer');

interface PreparedArtifact {
  readonly content: string;
  readonly directory: string;
  readonly finalPath: string;
  readonly normalizedPath: string;
  readonly tempPath: string;
}

/**
 * Persists artifacts so readers (config-saver's 10-second poll, the list API) only
 * ever see complete files. Duplicate and symlink checks run first and fail before
 * anything touches disk. Then one write of
 *
 *   { relPath: 'callbacks/foobar.json', content: '<svelte src>' }
 *
 *   prepare              prepareArtifact: in the JS heap, plan the final path and a
 *                        hidden temp name beside it. Nothing on disk yet.
 *   write content to RAM stageTempFiles: the temp file's name and content are
 *                        written into RAM (page cache). foobar.json is untouched,
 *                        so half-written moments are never committed.
 *   push content to device syncTempFile: fsync(temp) forces the content onto the
 *                          storage device.
 *   swap name in RAM     renameIntoPlace: the directory's entry list flips
 *                        .foobar.tmp → foobar.json, one atomic edit in RAM.
 *                        Readers flip old → new instantly.
 *   push name to device  syncTouchedDirectories: fsync of the directory forces
 *                        the swapped entry list onto the device.
 *
 * Staging exists because writing content is many steps (truncate, chunk, close) —
 * done on foobar.json directly, readers would see garbage between them. A rename
 * is one step, so it can be atomic. On failure the temp file is deleted and
 * foobar.json is exactly as it was.
 *
 * @returns A layer providing the artifact writer, requiring the platform FileSystem and the fsync service.
 */
export const WriterLive: Layer.Layer<
  WriterService,
  never,
  FileSystem.FileSystem | Path.Path | FileSyncService
> = Layer.effect(
  Writer,
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const fileSync = yield* FileSync;
    const configDir = yield* componentConfigDir;

    /**
     * Builds the staged-write plan for one artifact, failing on an unsafe path:
     *
     *   artifact = { relPath: 'widgets/x.js', content: '...' }
     *     → returns { finalPath: '<configDir>/widgets/x.js',
     *                 directory: '<configDir>/widgets',
     *                 tempPath: '<configDir>/widgets/.x.<millis>.<rand>.tmp', … }
     */
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
      const finalPath = path.join(configDir, artifact.relPath);
      const directory = path.dirname(finalPath);
      const basename = artifact.relPath.slice(artifact.relPath.lastIndexOf('/') + 1);
      return Effect.map(DateTime.now, (now) => ({
        content: artifact.content,
        directory,
        finalPath,
        normalizedPath: artifact.relPath,
        tempPath: path.join(
          directory,
          `.${basename}.${DateTime.toEpochMillis(now)}.${Math.random().toString(36).slice(2)}.tmp`,
        ),
      }));
    };

    /** Finds the first artifact claiming a path another artifact already claims. */
    const findDuplicatePath = (prepared: ReadonlyArray<PreparedArtifact>): string | undefined => {
      const seenPaths = new Set<string>();
      for (const artifact of prepared) {
        if (seenPaths.has(artifact.normalizedPath)) {
          return artifact.normalizedPath;
        }
        seenPaths.add(artifact.normalizedPath);
      }
      return undefined;
    };

    /** Rejects symlink path segments to prevent cloned repositories from escaping the tracked subtree. */
    const ensureNoSymlink = (relPath: string): Effect.Effect<void, ArtifactWriterError> => {
      const probes = relPath
        .split('/')
        .reduce<string[]>(
          (parts, segment) => [...parts, [parts.at(-1) ?? configDir, segment].join('/')],
          [configDir],
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

    /** Stages every artifact as a temporary file next to its final location. */
    const stageTempFiles = (
      prepared: ReadonlyArray<PreparedArtifact>,
    ): Effect.Effect<void, ArtifactWriterError> =>
      Effect.forEach(
        prepared,
        ({ content, directory, tempPath }) =>
          Effect.gen(function* () {
            yield* fileSystem
              .makeDirectory(directory, { recursive: true })
              .pipe(catchFsErrors(ArtifactWriterError, 'Unable to create component directory'));
            yield* fileSystem
              .writeFileString(tempPath, content)
              .pipe(catchFsErrors(ArtifactWriterError, 'Unable to write temporary component file'));
            yield* syncTempFile(tempPath);
          }),
        { discard: true },
      );

    /**
     * The injected sync policy — fsync ordering is the invariant "content durable
     * before the name that points at it": temp files sync before their rename,
     * directories after. Removing the policy removes crash durability only; the
     * atomicity of write-hidden → swap is untouched.
     */
    const syncTempFile = (tempPath: string) =>
      fileSync
        .fsync(tempPath)
        .pipe(
          Effect.catchTag('FileSyncError', (cause) =>
            Effect.fail(
              new ArtifactWriterError({ message: 'Unable to sync component file', cause }),
            ),
          ),
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
          fileSystem
            .rename(tempPath, finalPath)
            .pipe(
              catchFsErrors(ArtifactWriterError, 'Unable to atomically replace component file'),
            ),
        { discard: true },
      );

    /** Syncs every touched directory, deepest first, after all renames. */
    const syncTouchedDirectories = (prepared: ReadonlyArray<PreparedArtifact>) =>
      fileSync.fsyncDirectoryChain(prepared.map(({ directory }) => directory)).pipe(
        Effect.catchTag('FileSyncError', (cause) =>
          Effect.fail(
            new ArtifactWriterError({
              message: 'Unable to sync component directory',
              cause,
            }),
          ),
        ),
      );

    return {
      write: (artifacts) =>
        Effect.gen(function* () {
          const prepared = yield* Effect.forEach(artifacts, prepareArtifact);
          const duplicate = findDuplicatePath(prepared);
          if (duplicate !== undefined) {
            return yield* Effect.fail(
              new ArtifactWriterError({
                message: `Duplicate component path: ${duplicate}`,
              }),
            );
          }
          yield* Effect.forEach(prepared, ({ normalizedPath }) => ensureNoSymlink(normalizedPath), {
            discard: true,
          });
          yield* stageTempFiles(prepared).pipe(
            Effect.onError(() =>
              Effect.forEach(
                prepared,
                ({ tempPath }) => Effect.ignore(fileSystem.remove(tempPath, { force: true })),
                { discard: true },
              ),
            ),
          );
          yield* renameIntoPlace(prepared).pipe(
            Effect.onError(() =>
              Effect.forEach(
                prepared,
                ({ tempPath }) => Effect.ignore(fileSystem.remove(tempPath, { force: true })),
                { discard: true },
              ),
            ),
          );
          yield* syncTouchedDirectories(prepared);
        }),
    };
  }),
);
