/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Layer } from 'effect';
import { type FileHandle, open } from 'node:fs/promises';

import { FileSync } from './component.types';

/** Real `fsync` so acknowledged component saves survive crashes. */
export const FileSyncLive: Layer.Layer<FileSync> = Layer.succeed(FileSync, {
  fsync: (path) =>
    Effect.tryPromise({
      try: async () => {
        let handle: FileHandle | undefined;
        try {
          handle = await open(path, 'r');
          await handle.sync();
        } finally {
          if (handle !== undefined) {
            await handle.close().catch(() => undefined);
          }
        }
      },
      catch: (cause) =>
        cause instanceof Error ? new Error(`Unable to fsync ${path}`, { cause }) : cause,
    }),
});
