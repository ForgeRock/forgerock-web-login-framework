import { Effect } from 'effect';
import { FileSystem } from '@effect/platform';
import type { PlatformError } from '@effect/platform/Error';
import { isExcluded } from '../config/exclusions.js';
import { FileSystemError } from '../errors.js';

import path from 'node:path';
import { normalizeSeparators } from '../utils.js';

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
  return PROTECTED_DIRS.some((dir) => `${normalized}/`.startsWith(dir));
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
