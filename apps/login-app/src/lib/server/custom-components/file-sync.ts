/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { type FileHandle, open } from 'node:fs/promises';

import type { FileSyncService } from './component.types';

/** Opens a file or directory, synchronizes it, and always attempts to close the handle. */
const syncPath = async (path: string, flags: string, target: string): Promise<void> => {
  let handle: FileHandle | undefined;
  try {
    handle = await open(path, flags);
    await handle.sync();
  } catch (cause) {
    const message = handle === undefined ? `Unable to open ${path}` : `Unable to sync ${target}`;
    throw new Error(message, { cause });
  } finally {
    if (handle !== undefined) {
      await handle.close().catch(() => undefined);
    }
  }
};

/** Real file and directory `fsync` operations for durable component saves. */
export const fileSync: FileSyncService = {
  syncFile: (path) => syncPath(path, 'r+', 'temporary component file'),
  syncDirectory: (path) => syncPath(path, 'r', 'component directory'),
};

/** No-op implementation for tests that do not verify durability syncing. */
export const fileSyncNoop: FileSyncService = {
  syncFile: async () => undefined,
  syncDirectory: async () => undefined,
};
