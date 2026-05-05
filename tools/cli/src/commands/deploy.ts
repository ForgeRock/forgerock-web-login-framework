import { Args, Command } from '@effect/cli';
import { FileSystem, Path } from '@effect/platform';
import { Console, Effect } from 'effect';
import path from 'node:path';

import {
  AlchemyExitError,
  InvalidDeployConfigError,
  MissingDeployConfigError,
  NotInFrameworkProjectError,
} from '../errors.js';
import { readDeployConfig } from '../config/deploy.js';
import { isFrameworkDirectory, expandTilde } from '../services/file-system.js';
import { ProcessRunner } from '../services/process-runner.js';

const KNOWN_SCRIPTS = ['deploy', 'dev', 'destroy', 'logs', 'tail'] as const;
export type DeployScript = (typeof KNOWN_SCRIPTS)[number];

/**
 * Core deploy logic, factored out of the @effect/cli wrapper so it can be
 * tested directly with a fake ProcessRunner layer. Resolves the deploy
 * config from `.ping-lf/config.json`, then spawns `pnpm run <script>` in
 * the configured templateDir. Exit code is surfaced as AlchemyExitError
 * (non-zero) so the caller can render an actionable message.
 */
export const runDeploy = (
  projectDir: string,
  script: DeployScript,
): Effect.Effect<
  void,
  | NotInFrameworkProjectError
  | MissingDeployConfigError
  | InvalidDeployConfigError
  | AlchemyExitError,
  FileSystem.FileSystem | ProcessRunner
> =>
  Effect.gen(function* () {
    const isFramework = yield* isFrameworkDirectory(projectDir);
    if (!isFramework) {
      return yield* new NotInFrameworkProjectError({ path: projectDir });
    }

    const config = yield* readDeployConfig(projectDir);
    const resolvedTemplateDir = path.resolve(projectDir, config.templateDir);

    const runner = yield* ProcessRunner;
    const exitCode = yield* runner.run('pnpm', ['run', script], { cwd: resolvedTemplateDir });

    if (exitCode !== 0) {
      return yield* new AlchemyExitError({ exitCode, script });
    }
  });

const scriptChoices: ReadonlyArray<[string, DeployScript]> = KNOWN_SCRIPTS.map((s) => [s, s]);

export const deployCommand = Command.make(
  'deploy',
  {
    script: Args.choice(scriptChoices).pipe(
      Args.withDefault<DeployScript>('deploy'),
      Args.withDescription(
        'Script to run from the deploy template (default: deploy). One of: deploy, dev, destroy, logs, tail.',
      ),
    ),
  },
  ({ script }) =>
    Effect.gen(function* () {
      const fsPath = yield* Path.Path;
      const cwd = fsPath.resolve(expandTilde(process.cwd()));
      yield* Console.log(`\nRunning '${script}' for the configured deploy target...\n`);
      yield* runDeploy(cwd, script);
    }),
).pipe(
  Command.withDescription(
    'Run a script from the configured deploy template (alias for "pnpm run <script>" in the template directory).',
  ),
);
