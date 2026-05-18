import { McpServer, Tool, Toolkit } from '@effect/ai';
import { NodeContext, NodeRuntime, NodeSink, NodeStream } from '@effect/platform-node';
import { Effect, Layer, Logger, Option, Schema } from 'effect';
import { createRequire } from 'node:module';

import { scaffoldComponent } from './commands/generate.js';
import { initProject } from './commands/init.js';
import { resolveSource } from './commands/source.js';
import { assertValidProject, writeVersion } from './config/version.js';
import { copyWithExclusions } from './services/file-system.js';
import { runRegistryScript } from './services/registry.js';
import { GithubReleaseLayer, Release } from './services/release.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

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
    initProject({
      directory,
      version: Option.fromNullable(ver),
      local: Option.fromNullable(local),
    }).pipe(
      Effect.map(() => `Project initialized successfully in "${directory}".`),
      Effect.catchAll((err) => Effect.fail(String(err))),
      Effect.provide(Layer.merge(NodeContext.layer, GithubReleaseLayer)),
    ),

  generate_callback: ({ name }) =>
    scaffoldComponent('callback', name).pipe(
      Effect.map(() => `Callback component "${name}" scaffolded successfully.`),
      Effect.catchAll((err) => Effect.fail(String(err))),
      Effect.provide(NodeContext.layer),
    ),

  generate_stage: ({ name }) =>
    scaffoldComponent('stage', name).pipe(
      Effect.map(() => `Stage component "${name}" scaffolded successfully.`),
      Effect.catchAll((err) => Effect.fail(String(err))),
      Effect.provide(NodeContext.layer),
    ),

  update: ({ version: ver, local }) =>
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
    }).pipe(
      Effect.catchAll((err) => Effect.fail(String(err))),
      Effect.provide(Layer.merge(NodeContext.layer, GithubReleaseLayer)),
    ),

  list_releases: () =>
    Effect.gen(function* () {
      const release = yield* Release;
      const releases = yield* release.listReleases();
      return releases.map(({ tag, publishedAt }) => `${tag.padEnd(10)} ${publishedAt}`).join('\n');
    }).pipe(
      Effect.catchAll((err) => Effect.fail(String(err))),
      Effect.provide(GithubReleaseLayer),
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
