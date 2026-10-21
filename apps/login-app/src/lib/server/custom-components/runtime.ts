/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { Path } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { Layer } from 'effect';

import { log } from '$server/logger.effects';
import { getUserRolesFromSession } from '$server/sessions';
import { AuthLive } from './auth/auth';
import { type ComponentLogger, Log } from './log';
import { PublishLive } from './publish/publish';
import { SettingsLive } from './settings';
import { StoreLive } from './store/store';
import { FileSyncLive } from './writer/file-sync';
import { WriterLive } from './writer/writer';

import type { AuthService } from './auth/auth';
import type { PublishService } from './publish/publish';
import type { ComponentStoreApi } from './store/store';

/**
 * The real Component API dependency graph. Handlers provide it per request
 * (`Effect.provide(…, ComponentApiLive)`), so the layer is rebuilt for each request
 * and env vars are re-read at that point. Tests provide their own layers instead of
 * importing this.
 */
export const ComponentApiLive: Layer.Layer<
  ComponentStoreApi | AuthService | PublishService | ComponentLogger
> = Layer.suspend(() => {
  const LogLive = Layer.succeed(Log, log);
  const fileSyncLive = FileSyncLive.pipe(
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
  );
  const writerLive = WriterLive.pipe(
    Layer.provide(fileSyncLive),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
  );
  return Layer.mergeAll(
    StoreLive.pipe(
      Layer.provide(writerLive),
      Layer.provide(fileSyncLive),
      Layer.provide(NodeFileSystem.layer),
      Layer.provide(Path.layer),
      Layer.provide(LogLive),
    ),
    AuthLive(getUserRolesFromSession),
    PublishLive.pipe(Layer.provide(writerLive)),
    LogLive,
  );
}).pipe(Layer.provide(SettingsLive));
