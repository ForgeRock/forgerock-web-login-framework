/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data, Effect, Layer } from 'effect';
import { type FileHandle, open } from 'node:fs/promises';

/** Error emitted when filesystem durability synchronization cannot complete. */
export class FileSyncError extends Data.TaggedError('FileSyncError')<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Synchronizes filesystem entries after writes and renames so acknowledged saves are durable.
 */
export interface FileSyncService {
  readonly syncFile: (path: string) => Effect.Effect<void, FileSyncError>;
  readonly syncDirectory: (path: string) => Effect.Effect<void, FileSyncError>;
}

/** Service tag for the filesystem durability operations required by component persistence. */
const FileSyncTag = Context.GenericTag<FileSyncService>('@login-app/FileSync');

/** Service tag and layers for filesystem durability operations required by component persistence. */
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

/**
 * Opens a file, passes its handle to an Effect, and always attempts to close it afterward.
 *
 * @param path - Filesystem path to open.
 * @param flags - Node.js flags controlling how the file is opened.
 * @param use - Effect that uses the opened file handle.
 * @returns An effect with the value returned by `use`.
 * @throws {FileSyncError} When opening the file fails.
 */
const withFileHandle = <A>(
  path: string,
  flags: string,
  use: (handle: FileHandle) => Effect.Effect<A, FileSyncError>,
): Effect.Effect<A, FileSyncError> =>
  Effect.acquireUseRelease(
    Effect.tryPromise({
      try: () => open(path, flags),
      catch: (cause) => new FileSyncError({ message: `Unable to open ${path}`, cause }),
    }),
    use,
    (handle) => Effect.tryPromise(() => handle.close()).pipe(Effect.catchAll(() => Effect.void)),
  );

/**
 * Opens and synchronizes a file or directory path for durable persistence.
 *
 * @param path - Filesystem path to synchronize.
 * @param flags - Node.js flags appropriate for opening the target.
 * @param target - Human-readable target name used in failure messages.
 * @returns An effect that completes once synchronization succeeds.
 * @throws {FileSyncError} When opening or synchronizing the path fails.
 */
const syncPath = (
  path: string,
  flags: string,
  target: string,
): Effect.Effect<void, FileSyncError> =>
  withFileHandle(path, flags, (handle) =>
    Effect.tryPromise({
      try: () => handle.sync(),
      catch: (cause) => new FileSyncError({ message: `Unable to sync ${target}`, cause }),
    }),
  );
