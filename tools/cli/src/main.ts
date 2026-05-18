#!/usr/bin/env node
import { Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect, Layer } from 'effect';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateCommand } from './commands/generate.js';
import { initCommand } from './commands/init.js';
import { releasesCommand } from './commands/releases.js';
import { updateCommand } from './commands/update.js';
import { GithubReleaseLayer } from './services/release.js';

if (process.argv[2] === '--mcp') {
  const { runMcpServer } = await import('./mcp.js');
  runMcpServer();
} else {
  const { version } = JSON.parse(
    readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'),
  ) as { version: string };

  const rootCommand = Command.make('ping-lf').pipe(
    Command.withDescription(
      'CLI for initializing, scaffolding, and updating Ping Login Widget and Login App custom component projects.',
    ),
    Command.withSubcommands([initCommand, generateCommand, updateCommand, releasesCommand]),
  );

  const cli = Command.run(rootCommand, {
    name: 'ping-lf',
    version,
  });

  cli(process.argv).pipe(
    Effect.catchTag('DirectoryConflictError', (err) =>
      Console.error(
        `\nError: "${err.path}" already contains a framework project.` +
          `\n  Did you mean to use --local?\n` +
          `\n    ping-lf init <new-directory> --local ${err.path}\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('DirectoryNotEmptyError', (err) =>
      Console.error(
        `\nError: "${err.path}" already exists and is not empty.` +
          `\n  Choose a different directory name, or delete the existing directory first.\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('ReleaseNetworkError', (err) =>
      Console.error(
        `\nError: Could not reach GitHub to download the release.\n` +
          `  ${err.cause}\n\n` +
          `  • Check your network connection and try again.\n` +
          `  • Use a local path:   ping-lf init <dir> --local <path>\n` +
          `  • Specify a version:  ping-lf init <dir> --version v1.0.0\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('ReleaseParseError', (err) =>
      Console.error(`\nError: Failed to parse the release data.\n  ${err.cause}\n`).pipe(
        Effect.andThen(Effect.die(err)),
      ),
    ),
    Effect.catchTag('ReleaseFsError', (err) =>
      Console.error(
        `\nError: Filesystem error during release download (${err.operation}).\n  ${err.cause}\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('InvalidVersionError', (err) =>
      Console.error(
        `\nError: "${err.version}" is not a valid version tag.\n` +
          `  Expected semver format like v1.0.0.\n` +
          `  Use "ping-lf releases" to list available versions.\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('ReleaseNotFoundError', (err) =>
      Console.error(
        `\nError: No releases found on GitHub.` +
          (err.cause ? `\n  ${err.cause}` : '') +
          `\n\n  • Check your network connection and try again.\n` +
          `  • Use a local path:   ping-lf init <dir> --local <path>\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('InvalidComponentNameError', (err) =>
      Console.error(
        `\nError: "${err.name}" is not a valid component name.\n` +
          `  Names must be PascalCase, start with an uppercase letter, and contain only letters and digits.\n` +
          `  Examples: MyCallback, JWTLogin, DefaultStage\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.catchTag('ComponentAlreadyExistsError', (err) =>
      Console.error(
        `\nError: component directory already exists: ${err.path}\n` +
          `  Choose a different name or delete the existing directory first.\n`,
      ).pipe(Effect.andThen(Effect.die(err))),
    ),
    Effect.provide(Layer.mergeAll(GithubReleaseLayer, NodeContext.layer)),
    (effect) => NodeRuntime.runMain(effect, { disableErrorReporting: true }),
  );
}
