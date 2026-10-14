import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';
import path from 'node:path';

import { isExcluded } from '../config/exclusions.js';
import { FileSystemError } from '../errors.js';
import { normalizeSeparators } from '../utils.js';

import type { PlatformError } from '@effect/platform/Error';

const wrapFsCall =
  (operation: string, fsPath: string) =>
  <A>(effect: Effect.Effect<A, PlatformError>): Effect.Effect<A, FileSystemError> => {
    const fail = (cause: PlatformError) =>
      Effect.fail(new FileSystemError({ operation, path: fsPath, cause }));
    return effect.pipe(Effect.catchTags({ SystemError: fail, BadArgument: fail }));
  };

/**
 * Returns true if the given directory looks like an initialized framework
 * project. Checks for `package.json` combined with either an `experimental/`
 * subdirectory or a `pnpm-workspace.yaml` file — both are reliable indicators
 * that the directory was created by `ping-lf init`.
 */
export const isFrameworkDirectory = Effect.fnUntraced(function* (dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const check = (p: string) => fs.exists(path.join(dir, p)).pipe(Effect.orElseSucceed(() => false));
  const hasPkgJson = yield* check('package.json');
  const hasExperimental = yield* check('experimental');
  const hasPnpmWorkspace = yield* check('pnpm-workspace.yaml');
  return hasPkgJson && (hasExperimental || hasPnpmWorkspace);
});

const PROTECTED_DIRS = ['experimental/custom/callbacks/', 'experimental/custom/stages/'] as const;

/**
 * Framework-shipped custom wrapper files. Each is a fixed, tracked,
 * user-editable file rendered by the login app (`+page.svelte` imports it
 * directly). The bulk copy skips them so `update` can never overwrite
 * customer edits; `copyWrapperFiles` backfills any the target is missing so a
 * project updated onto a framework version whose app imports the wrappers
 * still gets the defaults.
 */
export const CUSTOM_WRAPPER_FILES = [
  'experimental/custom/header/header.svelte',
  'experimental/custom/footer/footer.svelte',
] as const;

/** Expand a leading `~` to the user's home directory. */
export function expandTilde(p: string): string {
  if (p === '~' || p.startsWith('~/') || p.startsWith('~\\')) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '~';
    return p.replace('~', home);
  }
  return p;
}

function isProtected(relativePath: string): boolean {
  const normalized = normalizeSeparators(relativePath);
  return (
    PROTECTED_DIRS.some((dir) => `${normalized}/`.startsWith(dir)) ||
    (CUSTOM_WRAPPER_FILES as readonly string[]).includes(normalized)
  );
}

const walk = (
  fs: FileSystem.FileSystem,
  sourceDir: string,
  targetDir: string,
  dir: string,
): Effect.Effect<void, FileSystemError> =>
  Effect.gen(function* () {
    const entries = yield* fs.readDirectory(dir).pipe(wrapFsCall('readDirectory', dir));

    yield* Effect.forEach(
      entries.filter((entry) => {
        const relativePath = path.relative(sourceDir, path.join(dir, entry));
        return !isExcluded(relativePath) && !isProtected(relativePath);
      }),
      (entry) =>
        Effect.gen(function* () {
          const fullPath = path.join(dir, entry);
          const relativePath = path.relative(sourceDir, fullPath);
          const stat = yield* fs.stat(fullPath).pipe(wrapFsCall('stat', fullPath));
          const targetPath = path.join(targetDir, relativePath);

          yield* Effect.if(stat.type === 'Directory', {
            onTrue: () =>
              fs
                .makeDirectory(targetPath, { recursive: true })
                .pipe(
                  wrapFsCall('makeDirectory', targetPath),
                  Effect.andThen(walk(fs, sourceDir, targetDir, fullPath)),
                ),
            onFalse: () => {
              const parentDir = path.dirname(targetPath);
              return fs
                .makeDirectory(parentDir, { recursive: true })
                .pipe(
                  wrapFsCall('makeDirectory', parentDir),
                  Effect.andThen(
                    fs.copyFile(fullPath, targetPath).pipe(wrapFsCall('copyFile', fullPath)),
                  ),
                );
            },
          });
        }),
      { concurrency: 'unbounded' },
    );
  });

export const copyWithExclusions = (sourceDir: string, targetDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    yield* walk(fs, sourceDir, targetDir, sourceDir);
  });

/**
 * Backfills the framework-shipped wrapper files into `targetDir`, skipping any
 * the target already has. Customer edits are never overwritten — a file is
 * copied only when absent. A missing wrapper file in the source is a no-op,
 * which keeps older framework versions (whose app does not import wrappers)
 * safe to update from.
 */
export const copyWrapperFiles = (sourceDir: string, targetDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    yield* Effect.forEach(
      CUSTOM_WRAPPER_FILES,
      (relativePath) =>
        Effect.gen(function* () {
          const sourcePath = path.join(sourceDir, relativePath);
          const targetPath = path.join(targetDir, relativePath);

          const hasSource = yield* fs.exists(sourcePath).pipe(Effect.orElseSucceed(() => false));
          if (!hasSource) {
            return;
          }

          const hasTarget = yield* fs.exists(targetPath).pipe(Effect.orElseSucceed(() => false));
          if (hasTarget) {
            return;
          }

          const parentDir = path.dirname(targetPath);
          yield* fs
            .makeDirectory(parentDir, { recursive: true })
            .pipe(wrapFsCall('makeDirectory', parentDir));
          yield* fs.copyFile(sourcePath, targetPath).pipe(wrapFsCall('copyFile', sourcePath));
        }),
      { concurrency: 'unbounded', discard: true },
    );
  });
