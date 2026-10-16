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
 * Framework-shipped custom wrapper files. Each is a fixed, user-editable file
 * rendered by the login app (`+page.svelte` imports it directly). The bulk
 * copy skips them so `update` can never overwrite customer edits;
 * `copyWrapperFiles` backfills any the target is missing from the CLI's own
 * wrapper templates (see WRAPPER_TEMPLATE_ELEMENTS) so a project updated onto
 * a framework version whose app imports the wrappers still gets the defaults.
 */
export const CUSTOM_WRAPPER_FILES = [
  'experimental/custom/header/header.svelte',
  'experimental/custom/footer/footer.svelte',
] as const;

/**
 * The page elements that ship a wrapper file. `copyWrapperFiles` copies
 * `templates/wrapper/<element>.svelte` (the CLI's own shipped templates,
 * resolved like the callback/stage scaffold templates) into
 * `experimental/custom/<element>/<element>.svelte`.
 *
 * The CLI never reads the framework's `core/` tree — build-time vs. runtime
 * boundary — so it owns copies of the wrapper templates instead of importing
 * the framework's `core/.../wrapper-templates/`. The per-element order
 * matches CUSTOM_WRAPPER_FILES.
 */
export const WRAPPER_TEMPLATE_ELEMENTS = ['header', 'footer'] as const;

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
 * copied only when absent. The copy reads from the CLI's own wrapper templates
 * (`templates/wrapper/`, passed as `templatesDir`), mirroring the
 * callback/stage scaffold templates. A missing template is a no-op, which
 * keeps older CLI versions (whose paired framework app does not import
 * wrappers) safe.
 */
export const copyWrapperFiles = (targetDir: string, templatesDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    yield* Effect.forEach(
      // Pair each wrapper target element with its template source. Positional
      // zip on two pinned constants: the contract test pins both arrays and
      // their per-element order, so an accidental desync fails the build.
      WRAPPER_TEMPLATE_ELEMENTS.map((element, index) => ({
        element,
        wrapperPath: CUSTOM_WRAPPER_FILES[index],
      })),
      ({ element, wrapperPath }) =>
        Effect.gen(function* () {
          const sourcePath = path.join(templatesDir, 'wrapper', `${element}.svelte`);
          const targetPath = path.join(targetDir, wrapperPath);

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
