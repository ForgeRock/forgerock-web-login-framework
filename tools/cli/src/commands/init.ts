import { Args, Command, Options, Prompt } from '@effect/cli';
import { FileSystem, Path } from '@effect/platform';
import { Console, Effect, Option } from 'effect';

import { DirectoryConflictError, DirectoryNotEmptyError } from '../errors.js';
import { writeVersion } from '../config/version.js';
import type { DeployTarget } from '../config/deploy.js';
import { copyWithExclusions, expandTilde, isFrameworkDirectory } from '../services/file-system.js';
import { runRegistryScript } from '../services/registry.js';
import { setupDeployTarget } from '../services/deploy-setup.js';
import { resolveSource } from './source.js';

type DeployTargetChoice = DeployTarget | 'none';

const DEPLOY_TARGET_CHOICES = ['docker', 'cloudflare', 'aws', 'none'] as const;

const deployTargetPrompt = Prompt.select<DeployTargetChoice>({
  message: 'Pick a deployment target (or skip):',
  choices: [
    {
      title: 'Self-hosted Docker',
      value: 'docker',
      description: 'docker-compose (production-ready, single-replica)',
    },
    {
      title: 'Cloudflare Workers',
      value: 'cloudflare',
      description: 'Alchemy + Workers KV (preview — sessions WIP)',
    },
    {
      title: 'AWS Lambda',
      value: 'aws',
      description: 'Alchemy + Lambda + DynamoDB (preview — sessions WIP)',
    },
    {
      title: 'Skip',
      value: 'none',
      description: 'Configure deployment later by hand',
    },
  ],
});

/**
 * Minimal pnpm-workspace.yaml written to the customer project.
 * Intentionally omits `tools/` — that workspace entry exists only in the
 * upstream monorepo and is not needed (or valid) in a customer project.
 * The `deploy` entry is included only when a deploy target was chosen so
 * the template's package.json (alchemy + provider deps) gets installed.
 */
const buildPnpmWorkspace = (includeDeploy: boolean) =>
  `packages:
  - 'packages/*'
  - 'apps/*'
  - 'e2e'
${includeDeploy ? "  - 'deploy'\n" : ''}`;

const nextStepsMessage = (dir: string, target: DeployTargetChoice) => {
  const deploySteps =
    target === 'none'
      ? ''
      : `\nTo deploy:\n  ping-lf deploy           # runs the configured ${target} template\n`;
  return `
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
${deploySteps}`;
};

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
    version: Options.optional(
      Options.text('version').pipe(
        Options.withDescription(
          'Framework version tag to download (e.g. v1.2.0). If omitted, the main branch is used.',
        ),
      ),
    ),
    deployTarget: Options.optional(
      Options.choice('deploy-target', DEPLOY_TARGET_CHOICES).pipe(
        Options.withDescription(
          'Deploy template to scaffold under deploy/. One of: docker, cloudflare, aws, none. If omitted, you will be prompted.',
        ),
      ),
    ),
  },
  ({ directory, local, version, deployTarget }) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const resolvedDir = path.resolve(expandTilde(directory));

      yield* Console.log(
        `\nInitializing Ping Login Widget / Login App project in: ${resolvedDir}\n`,
      );

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

      // ── 0a. Resolve deploy target (CLI flag wins; prompt if unset) ────────
      // Prompt up-front so the user isn't waiting mid-download for a question.
      const target: DeployTargetChoice = yield* Option.match(deployTarget, {
        onNone: () => deployTargetPrompt,
        onSome: (t) => Effect.succeed(t),
      });

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

          // ── 2a. Copy chosen deploy template (skipped when target='none') ──
          // Done inside the scoped block so sourceDir is still available before
          // its temp-dir cleanup runs.
          if (target !== 'none') {
            yield* Console.log(`Setting up deploy template: ${target}...`);
            yield* setupDeployTarget(resolvedDir, sourceDir, target);
          }

          return resolvedVersion;
        }),
      );

      // ── 3. Write pnpm-workspace.yaml (omits tools/ present in upstream) ────
      yield* fs.writeFileString(
        path.join(resolvedDir, 'pnpm-workspace.yaml'),
        buildPnpmWorkspace(target !== 'none'),
      );

      // ── 4. Scaffold experimental/custom/ ──────────────────────────────────
      // copyWithExclusions already copies experimental/custom/demo/,
      // login-framework.ts, README.md, and tsconfig.json from the source.
      // Only callbacks/ and stages/ are protected (they hold user components).
      // Create them as empty dirs with .gitkeep — components come via `ping-lf generate`.
      yield* Console.log('Scaffolding custom component directories...');

      yield* Effect.forEach(
        ['callbacks', 'stages'] as const,
        (dir) =>
          Effect.gen(function* () {
            const customDir = path.join(resolvedDir, 'experimental', 'custom', dir);
            yield* fs.makeDirectory(customDir, { recursive: true });
            yield* fs.writeFileString(path.join(customDir, '.gitkeep'), '');
          }),
        { concurrency: 'unbounded', discard: true },
      );

      // ── 5. Generate custom-registry.ts ────────────────────────────────────
      // Run the canonical registry script so the file is immediately present
      // with the correct CustomRegistryEntry format. The empty callbacks/ and
      // stages/ dirs produce empty registries — no custom components yet.
      yield* Console.log('Generating custom component registry...');
      yield* runRegistryScript(resolvedDir);

      // ── 6. Write .generator-version ────────────────────────────────────────
      yield* writeVersion(resolvedDir, {
        version: resolvedVersion,
        commitHash: '',
        generatedAt: new Date().toISOString(),
      });

      // ── 7. Print next steps ───────────────────────────────────────────────
      yield* Console.log(nextStepsMessage(directory, target));
    }),
).pipe(
  Command.withDescription(
    'Bootstrap a new Ping Login Widget or Login App project from a GitHub release or a local framework path.',
  ),
);
