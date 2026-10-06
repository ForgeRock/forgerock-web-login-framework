/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { Layer } from 'effect';

import { log } from '$server/logger.effects';
import { getUserIdFromSession, getUserRolesForUser } from '$server/sessions';
import { WriterLive } from './artifact-writer';
import { AuthLive } from './auth';
import { Log } from './component.types';
import { FileSyncLive } from './file-sync';
import { PublishLive } from './publisher';
import { StoreLive } from './store';

import type { Auth, ComponentStoreConfig, Publish, Store } from './component.types';

/** The tracked config directory from the config-saver infrastructure contract. */
const config: ComponentStoreConfig = {
  trackedRoot: process.env.COMPONENT_CONFIG_DIR ?? '/config/config',
};

/** The real logger implementation, provided as a layer. */
const LogLive = Layer.succeed(Log, log);

/** One shared writer over the real fsync; every layer that writes reuses this instance. */
const writerLive = WriterLive(config).pipe(Layer.provide(FileSyncLive));

/**
 * The real Component API dependency graph, assembled once per server process from the
 * `COMPONENT_CONFIG_DIR` infrastructure contract with config-saver.
 * Tests provide their own layers instead of importing this.
 */
export const ComponentApiLive = Layer.mergeAll(
  StoreLive(config).pipe(
    Layer.provide(writerLive),
    Layer.provide(FileSyncLive),
    Layer.provide(LogLive),
  ),
  AuthLive({ getUserId: getUserIdFromSession, getRoles: getUserRolesForUser }),
  PublishLive.pipe(Layer.provide(writerLive), Layer.provide(FileSyncLive)),
  LogLive,
) as Layer.Layer<Store | Auth | Publish | Log>;
