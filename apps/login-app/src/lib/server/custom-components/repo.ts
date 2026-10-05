/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { lstat, mkdir, rename, writeFile } from 'node:fs/promises';

import type { ComponentArtifact, ComponentRepoConfig, FileSyncService } from './component.types';

/** Joins path segments with one slash between normalized boundaries. */
export const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

/**
 * Determines whether a bundle path is safe to write. Rejects absolute paths, Windows
 * separators, empty segments, traversal segments, and `.git` segments.
 */
export const isSafeRelativePath = (path: string): boolean =>
  typeof path === 'string' &&
  path.length > 0 &&
  !path.startsWith('/') &&
  !path.includes('\u0000') &&
  !path.includes('\\') &&
  !/^[a-zA-Z]:/.test(path) &&
  path.split('/').every((segment) => segment !== '..' && segment !== '.git' && segment !== '');

/** Rejects symlink path segments to prevent cloned repositories from escaping the tracked subtree. */
const ensureNoSymlink = async (trackedRoot: string, relPath: string): Promise<void> => {
  const paths = relPath
    .split('/')
    .reduce<string[]>(
      (parts, segment) => [...parts, joinPath(parts.at(-1) ?? trackedRoot, segment)],
      [trackedRoot],
    );
  for (const path of paths) {
    let stats;
    try {
      stats = await lstat(path);
    } catch (cause) {
      if (
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        cause.code === 'ENOENT'
      ) {
        continue;
      }
      throw new Error(`Unable to inspect component path ${path}`, { cause });
    }
    if (stats.isSymbolicLink()) {
      throw new Error(`Component path must not traverse symlinks: ${path}`);
    }
  }
};

/** Lists a directory and each ancestor through the tracked root in sync order (deepest first). */
const directoryChain = (trackedRoot: string, directory: string): ReadonlyArray<string> => {
  const relativeDirectory = directory.slice(trackedRoot.length).replace(/^\/+/, '');
  const directories = relativeDirectory
    ? relativeDirectory
        .split('/')
        .reduce<string[]>(
          (parts, segment) => [...parts, joinPath(parts.at(-1) ?? trackedRoot, segment)],
          [trackedRoot],
        )
    : [trackedRoot];

  return [...directories].reverse();
};

/**
 * Persists component artifacts beneath the configured repository path.
 *
 * Every write validates the relative path first, writes and `fsync`s temporary files,
 * atomically renames them into place, then `fsync`s parent directories so successful
 * saves survive crashes. This honors the config-repo pipeline contract: config-saver
 * polls every 10 seconds and will commit whatever complete files it finds.
 *
 * @param config - Repository root and tracked subtree configuration.
 * @param fileSync - Durability synchronization service.
 * @returns A function that validates and atomically replaces each artifact.
 * @throws {Error} When a path is unsafe, duplicated, or a filesystem operation fails.
 */
export const createComponentRepo =
  (config: ComponentRepoConfig, fileSync: FileSyncService) =>
  async (artifacts: ReadonlyArray<ComponentArtifact>): Promise<void> => {
    const trackedRoot = joinPath(config.repoDir, config.trackedSubpath);
    const prepared = artifacts.map((artifact, index) => {
      if (!isSafeRelativePath(artifact.relPath)) {
        throw new Error(`Artifact ${index} has an unsafe component path: ${artifact.relPath}`);
      }
      const finalPath = joinPath(trackedRoot, artifact.relPath);
      const directory = finalPath.slice(0, finalPath.lastIndexOf('/'));
      const basename = artifact.relPath.slice(artifact.relPath.lastIndexOf('/') + 1);
      return {
        content: artifact.content,
        directory,
        finalPath,
        normalizedPath: artifact.relPath,
        tempPath: joinPath(
          directory,
          `.${basename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`,
        ),
      };
    });

    const paths = new Set<string>();
    for (const artifact of prepared) {
      if (paths.has(artifact.normalizedPath)) {
        throw new Error(`Duplicate component path at artifact ${artifact.normalizedPath}`);
      }
      paths.add(artifact.normalizedPath);
    }

    for (const { normalizedPath } of prepared) {
      await ensureNoSymlink(trackedRoot, normalizedPath);
    }

    for (const { content, directory, tempPath } of prepared) {
      try {
        await mkdir(directory, { recursive: true });
        await writeFile(tempPath, content);
      } catch (cause) {
        const message =
          cause instanceof Error && cause.message.includes('write')
            ? 'Unable to write temporary component file'
            : 'Unable to create component directory';
        throw new Error(message, { cause });
      }
      await fileSync.syncFile(tempPath);
    }

    /**
     * Files are staged before any rename, then renamed in artifact order. Each individual
     * replacement is atomic, but this is not a directory-swap transaction: a later rename
     * failure can leave earlier files replaced. Callers receive one bundle-level error.
     */
    for (const { finalPath, tempPath } of prepared) {
      try {
        await rename(tempPath, finalPath);
      } catch (cause) {
        throw new Error('Unable to atomically replace component file', { cause });
      }
    }

    for (const directory of [
      ...new Set(prepared.flatMap(({ directory }) => directoryChain(trackedRoot, directory))),
    ]) {
      await fileSync.syncDirectory(directory);
    }
  };
