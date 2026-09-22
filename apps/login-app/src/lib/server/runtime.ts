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
 * Repository layer configured by the `CONFIG_REPO_DIR` and `CONFIG_TRACKED_SUBPATH`
 * infrastructure contract with config-saver.
 */
const componentRepoLayer = ComponentRepo.layer({
  repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
  trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
});

/** Shared repository runtime supplying filesystem and durable-sync services to component layers. */
const componentRepoRuntime = Layer.provide(
  componentRepoLayer,
  Layer.merge(NodeFileSystem.layer, FileSync.layer),
);

/**
 * Fully provisioned layer for component publishing. It supplies the publisher with repository,
 * Node filesystem, and durable file-sync implementations, so consumers require no services.
 */
export const ComponentPublisherRuntime: Layer.Layer<ComponentPublisherService, never, never> =
  Layer.provide(ComponentPublisher.layer, componentRepoRuntime);

/**
 * Fully provisioned layer for component storage and publishing API handlers.
 *
 * Composes both production services once so handlers remain focused on request policy rather than
 * infrastructure wiring; tests can replace this single runtime with deterministic service layers.
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
 * Re-exports the publisher tag as the server runtime's single composition point.
 *
 * Keeping this export adjacent to the production runtime gives tests one stable seam for replacing
 * publisher behavior without coupling handlers to their concrete infrastructure.
 */
export { ComponentPublisher };
