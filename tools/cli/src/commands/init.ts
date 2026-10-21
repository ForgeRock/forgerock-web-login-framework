import { Args, Command, Options } from '@effect/cli';
import { FileSystem, Path } from '@effect/platform';
import { Console, Effect } from 'effect';

import { writeVersion } from '../config/version.js';
import { DirectoryConflictError, DirectoryNotEmptyError } from '../errors.js';
import {
  copyWithExclusions,
  copyWrapperFiles,
  expandTilde,
  isFrameworkDirectory,
} from '../services/file-system.js';
import { getTemplatesDir } from './generate.js';
import { resolveSource } from './source.js';

import type { Option } from 'effect';

/**
 * Minimal pnpm-workspace.yaml written to the customer project.
 */
const PNPM_WORKSPACE = `packages:
  - 'packages/*'
  - 'apps/*'
  - 'e2e'
`;

/**
 * Custom component directories scaffolded (with .gitkeep) at project init.
 * Protected during `ping-lf update` — see PROTECTED_DIRS in services/file-system.
 */
export const CUSTOM_COMPONENT_DIRS = ['callbacks', 'stages'] as const;

const nextStepsMessage = (dir: string) => `
Done. Project initialized successfully.

Next steps:
  cd ${dir}
  pnpm install
  cp .env.example .env    # add your ForgeRock AM connection details
  pnpm dev

To scaffold your first custom component:
  ping-lf generate callback MyCallback
  ping-lf generate stage MyStage

Read the authoring guide: experimental/custom/README.md
`;

export interface InitProjectOptions {
  readonly directory: string;
  readonly local: Option.Option<string>;
  readonly version: Option.Option<string>;
}

export const initProject = ({ directory, local, version }: InitProjectOptions) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const resolvedDir = path.resolve(expandTilde(directory));

    yield* Console.log(`\nInitializing Ping Login Widget / Login App project in: ${resolvedDir}\n`);

    // ── 0. Validate target directory ──────────────────────────────────────
    const dirExists = yield* fs.exists(resolvedDir);
    if (dirExists) {
      const isFramework = yield* isFrameworkDirectory(resolvedDir);
      if (isFramework) {
        yield* Effect.fail(new DirectoryConflictError({ path: resolvedDir }));
      }

      const entries = yield* fs
        .readDirectory(resolvedDir)
        .pipe(Effect.orElseSucceed(() => [] as string[]));
      if (entries.length > 0) {
        yield* Effect.fail(new DirectoryNotEmptyError({ path: resolvedDir }));
      }
    }

    // ── 1. Resolve source + copy framework (scoped: temp dir auto-cleaned) ──
    // Effect.scoped closes the Scope that release.fetch opens, triggering
    // automatic removal of the .framework-tmp directory after copying.
    const resolvedVersion = yield* Effect.scoped(
      Effect.gen(function* () {
        const { sourceDir, resolvedVersion } = yield* resolveSource(local, version, resolvedDir);

        // ── 2. Create target directory + copy framework (with exclusions) ──
        yield* Console.log('Copying framework files...');
        yield* fs.makeDirectory(resolvedDir, { recursive: true });
        yield* copyWithExclusions(sourceDir, resolvedDir);

        // ── 2b. Place the framework-shipped wrapper files ──────────────────
        // The bulk copy skips them (they are file-protected: customer edits
        // to them must survive `update`), so init places them explicitly from
        // the CLI's own wrapper templates. The app's +page.svelte imports them
        // directly, so a project without them cannot build.
        yield* copyWrapperFiles(resolvedDir, getTemplatesDir());

        return resolvedVersion;
      }),
    );

    // ── 3. Write pnpm-workspace.yaml (omits tools/ present in upstream) ────
    yield* fs.writeFileString(path.join(resolvedDir, 'pnpm-workspace.yaml'), PNPM_WORKSPACE);

    // ── 4. Scaffold experimental/custom/ ──────────────────────────────────
    // copyWithExclusions already copies experimental/custom/demo/,
    // login-framework.ts, README.md, and tsconfig.json from the source.
    // Only the custom component dirs are protected (they hold user components).
    // Create them as empty dirs with .gitkeep — components come via `ping-lf generate`.
    yield* Console.log('Scaffolding custom component directories...');
    yield* Effect.forEach(
      CUSTOM_COMPONENT_DIRS,
      (dir) =>
        Effect.gen(function* () {
          const customDir = path.join(resolvedDir, 'experimental', 'custom', dir);
          yield* fs.makeDirectory(customDir, { recursive: true });
          yield* fs.writeFileString(path.join(customDir, '.gitkeep'), '');
        }),
      { concurrency: 'unbounded', discard: true },
    );

    // ── 5. Write .generator-version ────────────────────────────────────────
    yield* writeVersion(resolvedDir, {
      version: resolvedVersion,
      generatedAt: new Date().toISOString(),
    });

    // ── 6. Print next steps ───────────────────────────────────────────────
    yield* Console.log(nextStepsMessage(directory));
  });

export const initCommand = Command.make(
  'init',
  {
    directory: Args.text({ name: 'directory' }).pipe(
      Args.withDescription(
        'Directory to initialize the project in. Use "./" for the current directory.',
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
          'Framework Git release tag to download (e.g. @forgerock/login-widget@2.1.0 or v1.2.0). If omitted, the main branch is used.',
        ),
      ),
    ),
  },
  ({ directory, local, tag }) => initProject({ directory, local, version: tag }),
).pipe(
  Command.withDescription(
    'Bootstrap a new Ping Login Widget or Login App project from a GitHub release or a local framework path.',
  ),
);
