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
import { Effect, Layer } from 'effect';

import { log } from '$server/logger.effects';
import { getUserRolesFromSession } from '$server/sessions';
import { AuthLive } from './auth/auth';
import { PublishLive } from './publish/publish';
import { componentConfigDir, SettingsLive } from './settings';
import { type ComponentLogger, type ComponentStoreConfig, Log } from './shared';
import { StoreLive } from './store/store';
import { FileSyncLive, WriterLive } from './writer/writer';

import type { AuthFn } from './auth/auth';
import type { ComponentPublishFn } from './publish/publish';
import type { ComponentStoreApi } from './store/store';

/** Assembles the full Component API graph for one resolved config. */
const componentApiLayer = (
  config: ComponentStoreConfig,
): Layer.Layer<ComponentStoreApi | AuthFn | ComponentPublishFn | ComponentLogger> => {
  const LogLive = Layer.succeed(Log, log);
  const nodeFileSystem = NodeFileSystem.layer;
  const fileSyncLive = FileSyncLive.pipe(Layer.provide(nodeFileSystem));
  const writerLive = WriterLive(config).pipe(
    Layer.provide(fileSyncLive),
    Layer.provide(nodeFileSystem),
    Layer.provide(Path.layer),
  );
  return Layer.mergeAll(
    StoreLive(config).pipe(
      Layer.provide(writerLive),
      Layer.provide(fileSyncLive),
      Layer.provide(nodeFileSystem),
      Layer.provide(Path.layer),
      Layer.provide(LogLive),
    ),
    AuthLive(getUserRolesFromSession),
    PublishLive.pipe(Layer.provide(writerLive)),
    LogLive,
  ) as Layer.Layer<ComponentStoreApi | AuthFn | ComponentPublishFn | ComponentLogger>;
};

/**
 * The real Component API dependency graph, assembled once per server process from the
 * `COMPONENT_CONFIG_DIR` infrastructure contract with config-saver. Config resolves
 * when the layer builds, so a deployment sets the directory via the environment.
 * Tests provide their own layers instead of importing this.
 */
export const ComponentApiLive: Layer.Layer<
  ComponentStoreApi | AuthFn | ComponentPublishFn | ComponentLogger
> = Layer.unwrapEffect(
  Effect.map(
    Effect.orDie(
      Effect.map(componentConfigDir, (trackedRoot): ComponentStoreConfig => ({ trackedRoot })),
    ),
    componentApiLayer,
  ),
).pipe(Layer.provide(SettingsLive));
