/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { log } from '$server/logger.effects';
import { getUserIdFromSession, getUserRolesForUser } from '$server/sessions';
import { createComponentAuth } from './auth';
import { fileSync } from './file-sync';
import { createComponentPublisher } from './publisher';
import { createComponentStore } from './records';
import { createComponentRepo } from './repo';

import type { ComponentApiDependencies } from './component.types';

/**
 * Builds the real Component API dependency graph from the `CONFIG_REPO_DIR` and
 * `CONFIG_TRACKED_SUBPATH` infrastructure contract with config-saver. Tests construct their
 * own dependencies instead of calling this.
 */
export const componentApiDependencies = (): ComponentApiDependencies => {
  const config = {
    repoDir: process.env.CONFIG_REPO_DIR ?? '/config',
    trackedSubpath: process.env.CONFIG_TRACKED_SUBPATH ?? 'config',
  };
  const repo = createComponentRepo(config, fileSync);
  return {
    authenticate: createComponentAuth({
      getUserId: getUserIdFromSession,
      getRoles: getUserRolesForUser,
    }),
    store: createComponentStore(config, repo, fileSync, log),
    publish: createComponentPublisher(repo),
    log,
  };
};
