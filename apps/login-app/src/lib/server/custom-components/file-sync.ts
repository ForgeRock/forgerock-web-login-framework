/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data, Effect, Layer } from 'effect';
import { open } from 'node:fs/promises';

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

/** Opens a file or directory, synchronizes it, and always attempts to close the handle. */
const syncPath = (
  path: string,
  flags: string,
  target: string,
): Effect.Effect<void, FileSyncError> =>
  Effect.acquireUseRelease(
    Effect.tryPromise({
      try: () => open(path, flags),
      catch: (cause) => new FileSyncError({ message: `Unable to open ${path}`, cause }),
    }),
    (handle) =>
      Effect.tryPromise({
        try: () => handle.sync(),
        catch: (cause) => new FileSyncError({ message: `Unable to sync ${target}`, cause }),
      }),
    (handle) => Effect.tryPromise(() => handle.close()).pipe(Effect.catchAll(() => Effect.void)),
  );
