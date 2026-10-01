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

import { ComponentAuth, type ComponentAuthService } from './auth';
import { FileSync } from './file-sync';
import { ComponentPublisher, type ComponentPublisherService } from './publisher';
import { ComponentStore, type ComponentStoreService } from './records';
import { ComponentRepo } from './repo';

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
 * Fully provisioned layer for component storage and publishing API handlers, including
 * AM-session admin authentication.
 *
 * Composes production services once so handlers remain focused on request policy rather than
 * infrastructure wiring; tests can replace this single runtime with deterministic service layers.
 */
export const ComponentApiRuntime: Layer.Layer<
  ComponentStoreService | ComponentPublisherService | ComponentAuthService,
  never,
  never
> = Layer.merge(
  ComponentPublisherRuntime,
  Layer.merge(
    ComponentAuth.layer(),
    Layer.provide(
      ComponentStore.layer({
        repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
        trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
      }),
      Layer.merge(componentRepoRuntime, Layer.merge(NodeFileSystem.layer, FileSync.layer)),
    ),
  ),
);
