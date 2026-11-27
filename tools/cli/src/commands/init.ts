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
 * Minimal pnpm-workspace.yaml written to the customer project. `core` and
 * `themes` must stay listed: the scaffolded root's `build:framework` runs
 * `pnpm --filter framework-core run build`, which resolves no target when the
 * workspace glob omits the `core` package, and the app's theme tokens live in
 * `themes/`.
 */
const PNPM_WORKSPACE = `packages:
  - 'packages/*'
  - 'apps/*'
  - 'e2e'
  - 'themes'
  - 'core'
`;

/**
 * Custom component directories scaffolded (with .gitkeep) at project init.
 * Never touched by `ping-lf update`: the update copy skips the whole
 * customer sandbox (custom/) by default — see isSandboxPath in
 * config/exclusions.
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

Read the authoring guide: custom/components/README.md
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
        // includeSandbox: init is project bootstrap and owns the initial
        // custom/ tree — the only flow allowed to write inside the sandbox.
        yield* Console.log('Copying framework files...');
        yield* fs.makeDirectory(resolvedDir, { recursive: true });
        yield* copyWithExclusions(sourceDir, resolvedDir, { includeSandbox: true });

        // ── 2b. Place the framework-shipped wrapper files ──────────────────
        // The app's +page.svelte imports them directly, so a project without
        // them cannot build. They are placed explicitly from the CLI's own
        // wrapper templates; `update` never rewrites them (sandbox skip +
        // build-time Vite-plugin seed for projects that predate wrappers).
        yield* copyWrapperFiles(resolvedDir, getTemplatesDir());

        return resolvedVersion;
      }),
    );

    // ── 3. Write pnpm-workspace.yaml (omits tools/ present in upstream) ────
    yield* fs.writeFileString(path.join(resolvedDir, 'pnpm-workspace.yaml'), PNPM_WORKSPACE);

    // ── 3b. Write the IDE-only tsconfig.json ───────────────────────────────
    // The framework copy excludes tsconfig.json (the framework repo's own
    // config must not leak into the customer project), so init writes the
    // customer one explicitly from the CLI's template: it resolves the
    // authoring aliases ($login-framework, $custom) for editors. noEmit is
    // set — the build resolves aliases from the app/widget Vite configs.
    yield* Console.log('Writing tsconfig.json...');
    const tsconfigTemplate = path.join(getTemplatesDir(), 'tsconfig.json');
    const tsconfigSource = yield* fs.readFileString(tsconfigTemplate);
    yield* fs.writeFileString(path.join(resolvedDir, 'tsconfig.json'), tsconfigSource);

    // ── 3c. Write the customer .gitignore ─────────────────────────────────
    // The framework copy excludes .gitignore (the framework repo's own rules
    // ignore the custom/ sandbox and would hide generated customer components
    // and wrappers from `git add -A`), so init writes the customer one
    // explicitly from the CLI's template: build outputs, env files, test
    // artifacts, lockfile guards, and nothing under custom/.
    yield* Console.log('Writing .gitignore...');
    const gitignoreTemplate = path.join(getTemplatesDir(), 'gitignore');
    const gitignoreSource = yield* fs.readFileString(gitignoreTemplate);
    yield* fs.writeFileString(path.join(resolvedDir, '.gitignore'), gitignoreSource);

    // ── 3d. Write the customer-facing README.md ───────────────────────────
    // The framework copy excludes README.md (repo-root docs are
    // contributor-facing and never ship, see exclusions.ts), so init writes
    // a fresh customer-facing one from the CLI's template: what the project
    // is, the custom-components authoring guide, and ping-lf --help.
    yield* Console.log('Writing README.md...');
    const readmeTemplate = path.join(getTemplatesDir(), 'readme.md');
    const readmeSource = yield* fs.readFileString(readmeTemplate);
    yield* fs.writeFileString(path.join(resolvedDir, 'README.md'), readmeSource);

    // ── 4. Scaffold custom/components/ ────────────────────────────────────
    // copyWithExclusions ({ includeSandbox: true }) already copies
    // custom/components/demo/, login-framework.ts, and README.md from the
    // source. Create the customer component dirs as empty dirs with .gitkeep
    // — components come via `ping-lf generate`.
    yield* Console.log('Scaffolding custom component directories...');
    yield* Effect.forEach(
      CUSTOM_COMPONENT_DIRS,
      (dir) =>
        Effect.gen(function* () {
          const customDir = path.join(resolvedDir, 'custom', 'components', dir);
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
