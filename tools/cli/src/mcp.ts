import { McpServer, Tool, Toolkit } from '@effect/ai';
import { NodeContext, NodeRuntime, NodeSink, NodeStream } from '@effect/platform-node';
import { Cause, Effect, Layer, Logger, Option, Schema } from 'effect';
import { createRequire } from 'node:module';

import { scaffoldComponent } from './commands/generate.js';
import { initProject } from './commands/init.js';
import { resolveSource } from './commands/source.js';
import { assertValidProject, writeVersion } from './config/version.js';
import { copyWithExclusions } from './services/file-system.js';
import { runRegistryScript } from './services/registry.js';
import { GithubReleaseLayer, Release } from './services/release.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

// ── Shared error formatter ────────────────────────────────────────────────────

function formatError(cause: Cause.Cause<unknown>): string {
  const err = Cause.failureOption(cause);
  if (Option.isSome(err)) {
    const e = err.value as { _tag?: string; [k: string]: unknown };
    switch (e._tag) {
      case 'InvalidVersionError':
        return `Invalid version "${e['version']}". Expected semver format like v1.0.0.`;
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
        return `Error: ${JSON.stringify(e)}`;
    }
  }
  return `Unexpected error: ${Cause.pretty(cause)}`;
}

const catchToolErrors = <A>(effect: Effect.Effect<A, unknown, never>) =>
  effect.pipe(Effect.catchAllCause((cause) => Effect.fail(formatError(cause))));

// ── Tool definitions ─────────────────────────────────────────────────────────

const InitTool = Tool.make('init', {
  description:
    'Bootstrap a new Ping Login Widget / Login App project from a GitHub release or local path.',
  parameters: {
    directory: Schema.String.annotations({
      description: 'Directory to initialize the project in (e.g. "my-project" or "./")',
    }),
    version: Schema.optional(Schema.String).annotations({
      description: 'Framework version tag to download (e.g. v1.2.0). Defaults to latest.',
    }),
    local: Schema.optional(Schema.String).annotations({
      description: 'Path to a local framework directory instead of downloading from GitHub.',
    }),
  },
  success: Schema.String,
  failure: Schema.String,
});

const GenerateCallbackTool = Tool.make('generate_callback', {
  description:
    'Scaffold a new custom callback component under experimental/custom/callbacks/. Run from an initialized project root.',
  parameters: {
    name: Schema.String.annotations({
      description:
        'PascalCase component name (e.g. MyCallback). Must match the AM callback type string.',
    }),
  },
  success: Schema.String,
  failure: Schema.String,
});

const GenerateStageTool = Tool.make('generate_stage', {
  description:
    'Scaffold a new custom stage component under experimental/custom/stages/. Run from an initialized project root.',
  parameters: {
    name: Schema.String.annotations({
      description:
        'Stage name as configured on the AM journey Page Node (e.g. "DefaultLogin" or "My Login Stage").',
    }),
  },
  success: Schema.String,
  failure: Schema.String,
});

const UpdateTool = Tool.make('update', {
  description:
    'Fetch the latest (or specified) framework version and overwrite core files while preserving experimental/custom/. Run from an initialized project root.',
  parameters: {
    version: Schema.optional(Schema.String).annotations({
      description: 'Framework version tag to update to (e.g. v1.2.0). Defaults to latest.',
    }),
    local: Schema.optional(Schema.String).annotations({
      description: 'Path to a local framework directory instead of downloading from GitHub.',
    }),
  },
  success: Schema.String,
  failure: Schema.String,
});

const ListReleasesTool = Tool.make('list_releases', {
  description: 'List available Login Framework releases from GitHub.',
  parameters: {},
  success: Schema.String,
  failure: Schema.String,
});

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
      }).pipe(
        Effect.map(() => `Project initialized successfully in "${directory}".`),
        Effect.provide(Layer.merge(NodeContext.layer, GithubReleaseLayer)),
      ),
    ),

  generate_callback: ({ name }) =>
    catchToolErrors(
      scaffoldComponent('callback', name).pipe(
        Effect.map(() => `Callback component "${name}" scaffolded successfully.`),
        Effect.provide(NodeContext.layer),
      ),
    ),

  generate_stage: ({ name }) =>
    catchToolErrors(
      scaffoldComponent('stage', name).pipe(
        Effect.map(() => `Stage component "${name}" scaffolded successfully.`),
        Effect.provide(NodeContext.layer),
      ),
    ),

  update: ({ version: ver, local }) =>
    catchToolErrors(
      Effect.gen(function* () {
        const cwd = process.cwd();
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
          commitHash: '',
          generatedAt: new Date().toISOString(),
        });

        return `Updated from ${currentVersion.version} to ${resolvedVersion}. Run "pnpm install" if dependencies changed.`;
      }).pipe(Effect.provide(Layer.merge(NodeContext.layer, GithubReleaseLayer))),
    ),

  list_releases: () =>
    catchToolErrors(
      Release.pipe(
        Effect.flatMap((release) => release.listReleases()),
        Effect.map((releases) =>
          releases.map(({ tag, publishedAt }) => `${tag.padEnd(10)} ${publishedAt}`).join('\n'),
        ),
        Effect.provide(GithubReleaseLayer),
      ),
    ),
});

// ── Server layer ──────────────────────────────────────────────────────────────

const ServerLayer = McpServer.toolkit(mcpToolkit).pipe(
  Layer.provide(handlerLayer),
  Layer.provide(
    McpServer.layerStdio({
      name: 'ping-lf',
      version,
      stdin: NodeStream.stdin,
      stdout: NodeSink.stdout,
    }),
  ),
  Layer.provide(NodeContext.layer),
  Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
);

export const runMcpServer = () => Layer.launch(ServerLayer).pipe(NodeRuntime.runMain);
