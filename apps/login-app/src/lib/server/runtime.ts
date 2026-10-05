/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { NodeFileSystem } from '@effect/platform-node';
import { Layer } from 'effect';

import { ComponentPublisher, type ComponentPublisherService } from './component-publisher';
import { ComponentRepo, FileSync } from './component-repo';
import { ComponentStore, type ComponentStoreService } from './component-store';

/**
 * Configures repository persistence from the config-saver infrastructure contract.
 *
 * @category layers
 */
const componentRepoLayer = ComponentRepo.layer({
  repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
  trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
});

/**
 * Provides filesystem and durable-sync services to component repository layers.
 *
 * @category layers
 */
const componentRepoRuntime = Layer.provide(
  componentRepoLayer,
  Layer.merge(NodeFileSystem.layer, FileSync.layer),
);

/**
 * Provides a fully provisioned component publication service.
 *
 * **When to use**
 *
 * Use at an application boundary that needs to run publication effects without
 * supplying repository infrastructure.
 *
 * **Example** (Providing publication infrastructure)
 *
 * ```ts
 * const response = Effect.provide(publishComponent(bundle), ComponentPublisherRuntime)
 * ```
 *
 * @category layers
 */
export const ComponentPublisherRuntime: Layer.Layer<ComponentPublisherService, never, never> =
  Layer.provide(ComponentPublisher.layer, componentRepoRuntime);

/**
 * Provides the production storage and publication services used by Component API handlers.
 *
 * **When to use**
 *
 * Use when running an endpoint operation in production. Tests may replace this
 * composition point with deterministic service layers.
 *
 * @see {@link ComponentPublisherRuntime} for publication-only infrastructure.
 * @category layers
 */
export const ComponentApiRuntime: Layer.Layer<
  ComponentStoreService | ComponentPublisherService,
  never,
  never
> = Layer.merge(
  ComponentPublisherRuntime,
  Layer.provide(
    ComponentStore.layer({
      repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
      trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
    }),
    Layer.merge(componentRepoRuntime, Layer.merge(NodeFileSystem.layer, FileSync.layer)),
  ),
);

/**
 * Re-exports the publisher service tag from the production composition module.
 *
 * @category services
 */
export { ComponentPublisher };
