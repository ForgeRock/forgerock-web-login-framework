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

import {
  ComponentPublisher,
  ComponentPublisherLive,
  type ComponentPublisherService,
} from './component-publisher';
import { FileSyncLive, makeComponentRepoLive } from './component-repo';

// These environment variable names are an infrastructure contract with config-saver.
const componentRepoLive = makeComponentRepoLive({
  repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
  trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
});

const componentRepoRuntime = Layer.provide(
  componentRepoLive,
  Layer.merge(NodeFileSystem.layer, FileSyncLive),
);

export const ComponentPublisherRuntime: Layer.Layer<ComponentPublisherService, never, never> = Layer.provide(
  ComponentPublisherLive,
  componentRepoRuntime,
);

export { ComponentPublisher };
