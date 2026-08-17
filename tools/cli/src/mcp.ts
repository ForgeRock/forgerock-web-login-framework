import { McpServer, Tool, Toolkit } from '@effect/ai';
import { Command } from '@effect/cli';
import { NodeContext, NodeSink, NodeStream } from '@effect/platform-node';
import { Cause, Effect, Layer, Logger, Option, Schema } from 'effect';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scaffoldComponent } from './commands/generate.js';
import { initProject } from './commands/init.js';
import { resolveSource } from './commands/source.js';
import { assertValidProject, writeVersion } from './config/version.js';
import { copyWithExclusions, expandTilde } from './services/file-system.js';
import { runRegistryScript } from './services/registry.js';
import { GithubReleaseLayer, Release } from './services/release.js';

import type { FileSystem, Path } from '@effect/platform';

// Resolve package.json from either dist/src/ (compiled) or src/ (Vitest).
const __dir = dirname(fileURLToPath(import.meta.url));
const pkgPath = existsSync(resolve(__dir, '../../package.json'))
  ? resolve(__dir, '../../package.json')
  : resolve(__dir, '../package.json');
const { version } = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };

// ── Shared error formatter ────────────────────────────────────────────────────

function formatError(cause: Cause.Cause<unknown>): string {
  const err = Cause.failureOption(cause);
  if (Option.isSome(err)) {
    const e = err.value as { _tag?: string; [k: string]: unknown };
    switch (e._tag) {
      case 'InvalidVersionError':
        return `Invalid version "${e['version']}". Expected a Git tag like @forgerock/login-widget@2.1.0 or v1.0.0.`;
      case 'ReleaseNetworkError':
        return `Network error reaching GitHub: ${e['cause']}`;
      case 'ReleaseParseError':
        return `Failed to parse release data: ${e['cause']}`;
      case 'ReleaseFsError':
        return `Filesystem error during ${e['operation']}: ${e['cause']}`;
      case 'ReleaseNotFoundError':
        return `No releases found on GitHub${e['cause'] ? `: ${e['cause']}` : ''}.`;
      case 'FileSystemError':
        return `Filesystem error (${e['operation']}) at "${e['path']}": ${e['cause']}`;
      case 'GeneratorVersionError':
        return `Generator version error: ${e['message']}${e['path'] ? ` (${e['path']})` : ''}`;
      case 'RegistryScanError':
        return `Registry scan failed in "${e['directory']}": ${e['cause']}`;
      case 'DirectoryConflictError':
        return `"${e['path']}" already contains a framework project. Use local path instead.`;
      case 'DirectoryNotEmptyError':
        return `"${e['path']}" already exists and is not empty.`;
      case 'InvalidComponentNameError':
        return `"${e['name']}" is not a valid component name. Use PascalCase (e.g. MyCallback).`;
      case 'ComponentAlreadyExistsError':
        return `Component directory already exists: ${e['path']}`;
      default:
        try {
          return `Error: ${JSON.stringify(e, (_k, v) =>
            v instanceof Error ? { message: v.message, name: v.name } : v,
          )}`;
        } catch {
          return `Error: ${String(e)}`;
        }
    }
  }
  return `Unexpected error: ${Cause.pretty(cause)}`;
}

const toolLayer = Layer.mergeAll(GithubReleaseLayer, NodeContext.layer);

const catchToolErrors = <A>(
  effect: Effect.Effect<A, unknown, FileSystem.FileSystem | Path.Path | Release>,
) =>
  effect.pipe(
    Effect.provide(toolLayer),
    Effect.catchAll((err) => Effect.fail(formatError(Cause.fail(err)))),
  );

// ── Tool definitions ─────────────────────────────────────────────────────────

const InitTool = Tool.make('init', {
  description:
    'Bootstrap a new Ping Login Widget / Login App project from a GitHub release or local path.',
  parameters: {
    directory: Schema.String.annotations({
      description: 'Directory to initialize the project in (e.g. "my-project" or "./")',
    }),
    version: Schema.optional(Schema.String).annotations({
      description:
        'Framework Git release tag to download (e.g. @forgerock/login-widget@2.1.0 or v1.2.0). Defaults to main.',
    }),
    local: Schema.optional(Schema.String).annotations({
      description: 'Path to a local framework directory instead of downloading from GitHub.',
    }),
  },
  success: Schema.String,
  failure: Schema.String,
})
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, true)
  .annotate(Tool.Idempotent, false);

const directoryParam = Schema.optional(Schema.String).annotations({
  description:
    'Absolute path to the initialized project root. Defaults to the current working directory.',
});

const GenerateCallbackTool = Tool.make('generate_callback', {
  description:
    'Scaffold a new custom callback component under experimental/custom/callbacks/. Run from an initialized project root.',
  parameters: {
    name: Schema.String.annotations({
      description:
        'PascalCase component name (e.g. MyCallback). Must match the AM callback type string.',
    }),
    directory: directoryParam,
  },
  success: Schema.String,
  failure: Schema.String,
})
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, false)
  .annotate(Tool.Idempotent, false);

const GenerateStageTool = Tool.make('generate_stage', {
  description:
    'Scaffold a new custom stage component under experimental/custom/stages/. Run from an initialized project root.',
  parameters: {
    name: Schema.String.annotations({
      description:
        'Stage name as configured on the AM journey Page Node (e.g. "DefaultLogin" or "My Login Stage").',
    }),
    directory: directoryParam,
  },
  success: Schema.String,
  failure: Schema.String,
})
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, false)
  .annotate(Tool.Idempotent, false);

const UpdateTool = Tool.make('update', {
  description:
    'Fetch the latest (or specified) framework version and overwrite core files while preserving experimental/custom/. Run from an initialized project root.',
  parameters: {
    directory: directoryParam,
    version: Schema.optional(Schema.String).annotations({
      description:
        'Framework Git release tag to update to (e.g. @forgerock/login-widget@2.1.0 or v1.2.0). Defaults to main.',
    }),
    local: Schema.optional(Schema.String).annotations({
      description: 'Path to a local framework directory instead of downloading from GitHub.',
    }),
  },
  success: Schema.String,
  failure: Schema.String,
})
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, true)
  .annotate(Tool.Idempotent, false);

const ListReleasesTool = Tool.make('list_releases', {
  description: 'List available Login Framework releases from GitHub.',
  parameters: {},
  success: Schema.String,
  failure: Schema.String,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true)
  .annotate(Tool.Idempotent, true);

// ── Exported toolkit (used in tests) ─────────────────────────────────────────

export const mcpToolkit = Toolkit.make(
  InitTool,
  GenerateCallbackTool,
  GenerateStageTool,
  UpdateTool,
  ListReleasesTool,
);

// ── Tool handlers ─────────────────────────────────────────────────────────────

const handlerLayer = mcpToolkit.toLayer({
  init: ({ directory, version: ver, local }) =>
    catchToolErrors(
      initProject({
        directory,
        version: Option.fromNullable(ver),
        local: Option.fromNullable(local),
      }).pipe(Effect.map(() => `Project initialized successfully in "${directory}".`)),
    ),

  generate_callback: ({ name, directory }) =>
    catchToolErrors(
      scaffoldComponent('callback', name, directory).pipe(
        Effect.map(() => `Callback component "${name}" scaffolded successfully.`),
      ),
    ),

  generate_stage: ({ name, directory }) =>
    catchToolErrors(
      scaffoldComponent('stage', name, directory).pipe(
        Effect.map(() => `Stage component "${name}" scaffolded successfully.`),
      ),
    ),

  update: ({ version: ver, local, directory }) =>
    catchToolErrors(
      Effect.gen(function* () {
        const cwd = resolve(expandTilde(directory ?? process.cwd()));
        const currentVersion = yield* assertValidProject(cwd);

        const resolvedVersion = yield* Effect.scoped(
          Effect.gen(function* () {
            const { sourceDir, resolvedVersion } = yield* resolveSource(
              Option.fromNullable(local),
              Option.fromNullable(ver),
              cwd,
            );
            yield* copyWithExclusions(sourceDir, cwd);
            return resolvedVersion;
          }),
        );

        yield* runRegistryScript(cwd);
        yield* writeVersion(cwd, {
          version: resolvedVersion,
          generatedAt: new Date().toISOString(),
        });

        return `Updated from ${currentVersion.version} to ${resolvedVersion}. Run "pnpm install" if dependencies changed.`;
      }),
    ),

  list_releases: () =>
    catchToolErrors(
      Release.pipe(
        Effect.flatMap((release) => release.listReleases()),
        Effect.map((releases) =>
          releases.map(({ tag, publishedAt }) => `${tag.padEnd(10)} ${publishedAt}`).join('\n'),
        ),
      ),
    ),
});

// ── Server layer ──────────────────────────────────────────────────────────────

const ServerLayer = McpServer.toolkit(mcpToolkit).pipe(
  Layer.provide(handlerLayer),
  Layer.provide(
    Layer.mergeAll(
      McpServer.layerStdio({
        name: 'ping-lf',
        version,
        stdin: NodeStream.stdin,
        stdout: NodeSink.stdout,
      }),
      NodeContext.layer,
      Logger.add(Logger.prettyLogger({ stderr: true })),
    ),
  ),
);

export { ServerLayer };

// mcpCommand is registered only so `ping-lf --help` lists `mcp` as a subcommand.
// The actual MCP dispatch happens in main.ts via Layer.launch(ServerLayer) at the
// top level, outside the @effect/cli command handler where Layer.launch would
// nest a second fiber scope inside the CLI's already-running one.
export const mcpCommand = Command.make('mcp', {}, () => Effect.void).pipe(
  Command.withDescription('Start as an MCP server over stdio.'),
);
