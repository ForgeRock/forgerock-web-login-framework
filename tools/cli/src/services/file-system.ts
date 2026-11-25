import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';
import path from 'node:path';

import { isExcluded, isSandboxPath } from '../config/exclusions.js';
import { FileSystemError } from '../errors.js';

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
 * project. Checks for `package.json` combined with either a `custom/`
 * subdirectory or a `pnpm-workspace.yaml` file — both are reliable indicators
 * that the directory was created by `ping-lf init`.
 */
export const isFrameworkDirectory = Effect.fnUntraced(function* (dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const check = (p: string) => fs.exists(path.join(dir, p)).pipe(Effect.orElseSucceed(() => false));
  const hasPkgJson = yield* check('package.json');
  const hasCustom = yield* check('custom');
  const hasPnpmWorkspace = yield* check('pnpm-workspace.yaml');
  return hasPkgJson && (hasCustom || hasPnpmWorkspace);
});

/**
 * Framework-shipped custom wrapper files. Each is a fixed, user-editable file
 * rendered by the login app (`+page.svelte` imports it directly). `init`
 * places them from the CLI's own wrapper templates (see
 * WRAPPER_TEMPLATE_ELEMENTS); `update` never touches them — the customer
 * sandbox is skipped entirely and absent wrappers are seeded by the
 * framework's Vite plugin on the project's next build.
 */
export const CUSTOM_WRAPPER_FILES = [
  'custom/components/layout/header.svelte',
  'custom/components/layout/footer.svelte',
] as const;

/**
 * The page elements that ship a wrapper file. `copyWrapperFiles` copies
 * `templates/wrapper/<element>.svelte` (the CLI's own shipped templates,
 * resolved like the callback/stage scaffold templates) into
 * `custom/components/layout/<element>.svelte`.
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

/** Options for `copyWithExclusions`. */
export interface CopyWithExclusionsOptions {
  /**
   * Allow writing inside the customer sandbox (`custom/`). Only project
   * bootstrap (`ping-lf init`) sets this: it creates the project and its
   * initial `custom/` tree from the framework source. Every other flow
   * (notably `ping-lf update` and the MCP `update` tool) leaves this unset —
   * the default-deny sandbox skips the whole tree, so a customer's components,
   * wrapper edits, README, and demo changes survive every framework update.
   */
  readonly includeSandbox?: boolean;
}

const walk = (
  fs: FileSystem.FileSystem,
  sourceDir: string,
  targetDir: string,
  dir: string,
  options: CopyWithExclusionsOptions,
): Effect.Effect<void, FileSystemError> =>
  Effect.gen(function* () {
    const entries = yield* fs.readDirectory(dir).pipe(wrapFsCall('readDirectory', dir));

    yield* Effect.forEach(
      entries.filter((entry) => {
        const relativePath = path.relative(sourceDir, path.join(dir, entry));
        if (isExcluded(relativePath)) {
          return false;
        }
        return options.includeSandbox === true || !isSandboxPath(relativePath);
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
                  Effect.andThen(walk(fs, sourceDir, targetDir, fullPath, options)),
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

/**
 * Copies the framework source tree into the target project, skipping
 * build/SCM noise (`isExcluded`) and, by default, the entire customer sandbox
 * (`custom/` — see `isSandboxPath`). Only `ping-lf init` passes
 * `includeSandbox: true`; every framework-update flow (`update` command, MCP
 * `update`) keeps the sandbox sealed.
 */
export const copyWithExclusions = (
  sourceDir: string,
  targetDir: string,
  options: CopyWithExclusionsOptions = {},
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    yield* walk(fs, sourceDir, targetDir, sourceDir, options);
  });

/**
 * Places the framework-shipped wrapper files into `targetDir`, skipping any
 * the target already has. Customer edits are never overwritten — a file is
 * copied only when absent. The copy reads from the CLI's own wrapper templates
 * (`templates/wrapper/`, passed as `templatesDir`), mirroring the
 * callback/stage scaffold templates. A missing template is a no-op, which
 * keeps older CLI versions (whose paired framework app does not import
 * wrappers) safe.
 *
 * Called by `ping-lf init` only. Framework-update flows never write inside
 * `custom/` — a project updated from an older framework version gets any
 * missing wrappers from the framework Vite plugin's build-time seed
 * (`seedMissingWrappers`), which is fill-if-absent with the same guarantee.
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
