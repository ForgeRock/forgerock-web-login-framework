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

/**
 * Repository layer configured by the `CONFIG_REPO_DIR` and `CONFIG_TRACKED_SUBPATH`
 * infrastructure contract with config-saver.
 */
const componentRepoLayer = ComponentRepo.layer({
  repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
  trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
});

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

export { ComponentPublisher };
