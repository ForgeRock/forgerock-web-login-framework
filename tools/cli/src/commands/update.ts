import { Command, Options } from '@effect/cli';
import { FileSystem, Path } from '@effect/platform';
import { Console, Effect, Option } from 'effect';
import nodePath from 'node:path';

import { assertValidProject, writeVersion } from '../config/version.js';
import { copyWithExclusions, expandTilde } from '../services/file-system.js';
import { resolveSource } from './source.js';

/**
 * Framework-owned files that live inside the customer sandbox (`custom/`).
 *
 * The update copy runs default-deny: everything under `custom/` is
 * customer-owned and skipped, so customer components, wrapper edits, README
 * changes, and demo changes survive every framework upgrade. The curated
 * surface module is the one exception: it is shipped and versioned by the
 * framework even though it lives inside the sandbox (every custom component
 * imports it through `$login-framework`, and core/ re-exports move across
 * releases). A frozen copy breaks the build on the first renamed module, and
 * new curated exports would never arrive, so update explicitly refreshes each
 * file listed here from the update source, overwriting the project's copy.
 * Everything under `custom/` NOT listed here stays customer-owned and is
 * never written by an update.
 */
const SANDBOX_FRAMEWORK_FILES = ['custom/components/login-framework.ts'] as const;

/**
 * Sandbox locations scaffolded by CLI 0.2.x, which placed custom components
 * under `experimental/custom/`. Custom components now live under
 * `custom/components/{stages,callbacks}/`, and neither the framework build
 * nor the registry scans the legacy location, so components left there
 * silently drop out of the app after an update. When these directories
 * contain Svelte files, update prints the migration steps as a warning.
 */
const LEGACY_SANDBOX_DIRS = [
  'experimental/custom/stages',
  'experimental/custom/callbacks',
] as const;

/**
 * Counts `.svelte` files under `dir` recursively. Every filesystem failure
 * resolves to an empty count: this check only decides whether to print a
 * migration warning, and a directory that cannot be read must never fail the
 * update itself.
 */
const countSvelteFiles = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  dir: string,
): Effect.Effect<number> =>
  fs.readDirectory(dir).pipe(
    Effect.orElseSucceed(() => [] as string[]),
    Effect.flatMap((entries) =>
      Effect.map(
        Effect.forEach(
          entries,
          (entry) => {
            const fullPath = path.join(dir, entry);
            return fs.stat(fullPath).pipe(
              Effect.orElseSucceed(() => undefined),
              Effect.flatMap((stats) => {
                if (stats === undefined) {
                  return Effect.succeed(0);
                }
                return stats.type === 'Directory'
                  ? countSvelteFiles(fs, path, fullPath)
                  : Effect.succeed(entry.endsWith('.svelte') ? 1 : 0);
              }),
            );
          },
          { concurrency: 'unbounded' },
        ),
        (counts) => counts.reduce((sum, count) => sum + count, 0),
      ),
    ),
  );

/**
 * Prints the migration warning when a legacy `experimental/custom/` sandbox
 * still holds Svelte components. Best-effort and read-only: it never fails
 * the update.
 */
const warnAboutLegacySandbox = (fs: FileSystem.FileSystem, path: Path.Path, projectDir: string) =>
  Effect.gen(function* () {
    const legacyDirs = yield* Effect.map(
      Effect.forEach(
        LEGACY_SANDBOX_DIRS,
        (relativeDir) =>
          Effect.map(
            countSvelteFiles(fs, path, path.join(projectDir, relativeDir)),
            (count): readonly [string, number] => [relativeDir, count],
          ),
        { concurrency: 'unbounded' },
      ),
      (entries) => entries.filter(([_, count]) => count > 0).map(([relativeDir]) => relativeDir),
    );

    if (legacyDirs.length === 0) {
      return;
    }

    yield* Console.warn(
      `\nWarning: found custom components under the legacy ${legacyDirs.join(
        ' and ',
      )} directory.\n` +
        `  Custom components moved from "experimental/custom/" to "custom/components/". The legacy\n` +
        `  location is no longer scanned or built, so components left there drop out of the app.\n` +
        `  Migrate each component directory:\n` +
        `    1. Move it from experimental/custom/stages/<name> or experimental/custom/callbacks/<name>\n` +
        `       into custom/components/stages/ or custom/components/callbacks/.\n` +
        `    2. Update its imports to the "$login-framework" surface module.\n` +
        `    3. Run "ping-lf update" to refresh the framework-owned files.\n`,
    );
  });

/**
 * Refreshes the framework-owned files inside the customer sandbox (see
 * {@link SANDBOX_FRAMEWORK_FILES}) from the update source, overwriting the
 * project's copy. A source file that does not exist (an older release
 * tarball predating the surface) only warns: the project's existing copy is
 * kept and the update succeeds. Filesystem failures while copying propagate
 * and fail the update, the same way the main copy does.
 */
const refreshSandboxFrameworkFiles = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  sourceDir: string,
  projectDir: string,
  resolvedVersion: string,
) =>
  Effect.forEach(
    SANDBOX_FRAMEWORK_FILES,
    (relativePath) =>
      Effect.gen(function* () {
        const sourcePath = path.join(sourceDir, relativePath);
        const hasSource = yield* fs.exists(sourcePath).pipe(Effect.orElseSucceed(() => false));
        if (!hasSource) {
          yield* Console.warn(
            `\nWarning: could not refresh ${relativePath}: the framework source (${resolvedVersion}) does not ship it.\n` +
              `  Your existing copy was kept as-is.\n` +
              `  If the build fails on "$login-framework" exports, re-copy the file from the framework repository.\n`,
          );
          return;
        }
        const targetPath = path.join(projectDir, relativePath);
        yield* fs.makeDirectory(path.dirname(targetPath), { recursive: true });
        yield* fs.copyFile(sourcePath, targetPath);
        yield* Console.log(`Refreshed framework-owned file: ${relativePath}`);
      }),
    { concurrency: 'unbounded', discard: true },
  );

export interface UpdateProjectOptions {
  readonly directory: Option.Option<string>;
  readonly local: Option.Option<string>;
  readonly tag: Option.Option<string>;
}

export const updateProject = ({ directory, local, tag }: UpdateProjectOptions) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const cwd = nodePath.resolve(expandTilde(Option.getOrElse(directory, () => process.cwd())));

    // ── 1. Verify this is an initialized project ──────────────────────────
    const currentVersion = yield* assertValidProject(cwd);

    yield* Console.log(`\nUpdating project from version: ${currentVersion.version}\n`);

    // ── 1b. Detect a legacy experimental/custom sandbox (CLI 0.2.x) ───────
    // Read-only detection; never fails the update.
    yield* warnAboutLegacySandbox(fs, path, cwd);

    // ── 2. Resolve source + copy framework (scoped: temp dir auto-cleaned) ──
    // Effect.scoped closes the Scope that release.fetch opens, triggering
    // automatic removal of the .framework-tmp directory after copying.
    //
    // The copy runs with the default-deny sandbox: everything under custom/
    // (components, wrappers, README, demo) is customer-owned and skipped, so
    // an update can never write inside it. A project updated from an older
    // framework version that predates the wrapper files gets them from the
    // framework's Vite plugin, which seeds missing wrappers on the next
    // build/dev-server start (fill-if-absent, never overwrites edits).
    const resolvedVersion = yield* Effect.scoped(
      Effect.gen(function* () {
        const { sourceDir, resolvedVersion } = yield* resolveSource(local, tag, cwd);
        yield* Console.log('Copying updated framework files...');
        yield* copyWithExclusions(sourceDir, cwd);

        // ── 2b. Refresh the framework-owned files inside the sandbox ───────
        // The sandbox skip above is intentional for everything customer-owned;
        // the curated surface is framework-owned (see SANDBOX_FRAMEWORK_FILES)
        // and is refreshed explicitly here, overwriting the project's copy.
        yield* refreshSandboxFrameworkFiles(fs, path, sourceDir, cwd, resolvedVersion);

        return resolvedVersion;
      }),
    );

    // ── 3. Update .generator-version ──────────────────────────────────────
    // custom-registry.ts is NOT regenerated here — the framework's Vite
    // plugin regenerates it on the next build or dev-server start.
    yield* writeVersion(cwd, {
      version: resolvedVersion,
      generatedAt: new Date().toISOString(),
    });
    yield* Console.log(
      `\nDone. Updated from ${currentVersion.version} to ${resolvedVersion}.\n` +
        'Run "pnpm install" if package dependencies changed.\n',
    );
  });

export const updateCommand = Command.make(
  'update',
  {
    directory: Options.optional(
      Options.text('directory').pipe(
        Options.withDescription(
          'Project root directory. Defaults to the current working directory.',
        ),
      ),
    ),
    local: Options.optional(
      Options.text('local').pipe(
        Options.withDescription(
          'Path to a local framework directory. If omitted, the main branch is downloaded from GitHub.',
        ),
      ),
    ),
    tag: Options.optional(
      Options.text('tag').pipe(
        Options.withDescription(
          'Framework Git release tag to update to (e.g. @forgerock/login-widget@2.1.0 or v1.2.0). If omitted, the main branch is used.',
        ),
      ),
    ),
  },
  updateProject,
).pipe(
  Command.withDescription(
    'Fetch the latest (or a specified) framework version and overwrite core files while preserving custom/components/ (the framework-owned curated surface file is refreshed).',
  ),
);
