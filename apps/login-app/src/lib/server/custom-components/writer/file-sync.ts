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

import { componentConfigDir } from '../settings';

/** A failure raised when a filesystem durability operation cannot complete. */
export class FileSyncError extends Data.TaggedError('FileSyncError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * The filesystem durability service: fsyncs single paths and directory chains so
 * acknowledged saves survive power loss. Built on the platform `FileSystem` file
 * handle (`open` + `sync`), which has no path-level fsync of its own.
 */
export interface FileSyncService {
  readonly fsync: (path: string) => Effect.Effect<void, FileSyncError>;
  readonly fsyncDirectoryChain: (
    directories: ReadonlyArray<string>,
  ) => Effect.Effect<void, FileSyncError>;
}

export const FileSync = Context.GenericTag<FileSyncService>('FileSync');

/**
 * `fsync`s a file or directory through the platform `FileSystem` handle. The platform
 * closes the opened handle when the fsync's scope closes; a failed sync wins over a
 * failing close, and a close failure after a successful sync is reported instead of
 * becoming a platform release defect.
 */
export const FileSyncLive: Layer.Layer<FileSyncService, never, FileSystem.FileSystem | Path.Path> =
  Layer.effect(
    FileSync,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const configDir = yield* componentConfigDir;

      const fsync = (target: string) =>
        Effect.gen(function* () {
          const file = yield* fileSystem.open(target, { flag: 'r' });
          return yield* file.sync;
        }).pipe(
          Effect.scoped,
          Effect.catchTags({
            SystemError: (cause) =>
              Effect.fail(new FileSyncError({ message: `Unable to fsync ${target}`, cause })),
            BadArgument: (cause) =>
              Effect.fail(new FileSyncError({ message: `Unable to fsync ${target}`, cause })),
          }),
          Effect.catchAllDefect(
            (defect) =>
              new FileSyncError({
                message: `Unable to close ${target} after fsync`,
                cause: defect,
              }),
          ),
        );

      /** Lists a directory and each ancestor through the config directory, deepest first. */
      const directoryChain = (directory: string) => {
        const relativeDirectory = directory.slice(configDir.length).replace(/^\/+/, '');
        const directories = relativeDirectory
          ? relativeDirectory
              .split('/')
              .reduce<string[]>(
                (parts, segment) => [...parts, path.join(parts.at(-1) ?? configDir, segment)],
                [configDir],
              )
          : [configDir];

        return [...directories].reverse();
      };

      return {
        fsync,
        fsyncDirectoryChain: (directories) => {
          const touched = [
            ...new Set(directories.flatMap((directory) => directoryChain(directory))),
          ];
          return Effect.forEach(touched, (directory) => fsync(directory), {
            discard: true,
          });
        },
      };
    }),
  );
