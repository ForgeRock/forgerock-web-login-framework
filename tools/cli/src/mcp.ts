import { McpServer, Tool, Toolkit } from '@effect/ai';
import { Command } from '@effect/cli';
import { NodeContext, NodeSink, NodeStream } from '@effect/platform-node';
import { Cause, Console, Effect, Either, Layer, Logger, Option, Schema } from 'effect';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scaffoldComponent } from './commands/generate.js';
import { initProject } from './commands/init.js';
import { updateProject } from './commands/update.js';
import { parseComponentName, safeNameForTerminal } from './component-name.utilities.js';
import { GithubReleaseLayer, Release } from './services/release.js';

import type { FileSystem, Path } from '@effect/platform';

// Resolve package.json from either dist/src/ (compiled) or src/ (Vitest).
const __dir = dirname(fileURLToPath(import.meta.url));
const pkgPath = existsSync(resolve(__dir, '../../package.json'))
  ? resolve(__dir, '../../package.json')
  : resolve(__dir, '../package.json');
const { version } = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };

// ── Shared error formatter ────────────────────────────────────────────────────

export function formatError(cause: Cause.Cause<unknown>): string {
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
        return `Generator version error: ${e['message']}${
          e['path'] ? ` (${e['path']})` : ''
        }. Run the init tool first, or pass the directory parameter pointing at the root of a project created with ping-lf init.`;
      case 'DirectoryConflictError':
        return `"${e['path']}" already contains a framework project. Initialize in a different directory, or pass local: "${e['path']}" to bootstrap from an existing framework checkout.`;
      case 'DirectoryNotEmptyError':
        return `"${e['path']}" already exists and is not empty.`;
      case 'InvalidComponentNameError':
        return `"${safeNameForTerminal(
          String(e['name']),
        )}" is not a valid component name. For callbacks, use PascalCase (e.g. MyCallback). For stages, the name must contain at least one letter, be at least 2 characters, and be safe as a directory name (e.g. DefaultLogin or "My Login Stage") — stage names are not constrained to PascalCase.`;
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

/**
 * Console implementation whose log/info/debug/warn all write to stderr. The
 * MCP stdio transport speaks JSON-RPC on stdout; Effect's default Console
 * writes log() to process.stdout, so any Console.log reached from a tool
 * handler would corrupt the protocol stream. Everything the shared commands
 * log while running under MCP is progress noise, not tool output — the tool
 * result string is the payload — so redirecting it to stderr is safe and the
 * CLI path keeps the real Console.
 */
const stderrConsole: Console.Console = {
  [Console.TypeId]: Console.TypeId,
  assert: (condition, ...args) =>
    condition
      ? Effect.void
      : Effect.sync(() => process.stderr.write(`Assertion failed: ${args.join(' ')}\n`)),
  clear: Effect.void,
  count: () => Effect.void,
  countReset: () => Effect.void,
  debug: (...args) => Effect.sync(() => process.stderr.write(`${args.join(' ')}\n`)),
  dir: (item) => Effect.sync(() => process.stderr.write(`${String(item)}\n`)),
  dirxml: (item) => Effect.sync(() => process.stderr.write(`${String(item)}\n`)),
  error: (...args) => Effect.sync(() => process.stderr.write(`${args.join(' ')}\n`)),
  group: () => Effect.void,
  groupEnd: Effect.void,
  info: (...args) => Effect.sync(() => process.stderr.write(`${args.join(' ')}\n`)),
  log: (...args) => Effect.sync(() => process.stderr.write(`${args.join(' ')}\n`)),
  table: (tabularData) => Effect.sync(() => process.stderr.write(`${String(tabularData)}\n`)),
  time: () => Effect.void,
  timeEnd: () => Effect.void,
  timeLog: () => Effect.void,
  trace: (...args) => Effect.sync(() => process.stderr.write(`${args.join(' ')}\n`)),
  warn: (...args) => Effect.sync(() => process.stderr.write(`${args.join(' ')}\n`)),
  unsafe: {
    assert: (condition, ...args) => {
      if (!condition) {
        process.stderr.write(`Assertion failed: ${args.join(' ')}\n`);
      }
    },
    clear: () => undefined,
    count: () => undefined,
    countReset: () => undefined,
    debug: (...args) => process.stderr.write(`${args.join(' ')}\n`),
    dir: (item) => process.stderr.write(`${String(item)}\n`),
    dirxml: (item) => process.stderr.write(`${String(item)}\n`),
    error: (...args) => process.stderr.write(`${args.join(' ')}\n`),
    group: () => undefined,
    groupCollapsed: () => undefined,
    groupEnd: () => undefined,
    info: (...args) => process.stderr.write(`${args.join(' ')}\n`),
    log: (...args) => process.stderr.write(`${args.join(' ')}\n`),
    table: (tabularData) => process.stderr.write(`${String(tabularData)}\n`),
    time: () => undefined,
    timeEnd: () => undefined,
    timeLog: () => undefined,
    trace: (...args) => process.stderr.write(`${args.join(' ')}\n`),
    warn: (...args) => process.stderr.write(`${args.join(' ')}\n`),
  },
};

const catchToolErrors = <A>(
  effect: Effect.Effect<A, unknown, FileSystem.FileSystem | Path.Path | Release>,
) =>
  effect.pipe(
    // Console.log from the shared command implementations must never reach
    // stdout: the stdio transport uses it for JSON-RPC. Console state lives in
    // the fiber's services FiberRef, so the swap is withConsole (fiberRef
    // locally), not provideService. See stderrConsole.
    Effect.provide(toolLayer),
    Console.withConsole(stderrConsole),
    Effect.catchAll((err) => Effect.fail(formatError(Cause.fail(err)))),
  );

// ── Tool definitions ─────────────────────────────────────────────────────────

const InitTool = Tool.make('init', {
  description:
    'Bootstrap a new Ping Login Widget / Login App project from a GitHub release or local path. The project ships a custom/components/ sandbox for customer components; see the authoring guide at custom/components/README.md after init.',
  parameters: {
    directory: Schema.String.annotations({
      description: 'Directory to initialize the project in (e.g. "my-project" or "./")',
    }),
    version: Schema.optional(Schema.String).annotations({
      description:
        'Framework Git release tag to download (e.g. @forgerock/login-widget@2.1.0 or v1.2.0; CLI flag: --tag). Defaults to main.',
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

// SDKS-5510 authoring contract, shared by both generate tool descriptions:
// the import boundary and prop rules are the only authoring guidance an MCP
// client LLM receives, so each description carries it verbatim.
const AUTHORING_CONTRACT = `

Authoring contract (SDKS-5510): import only from the curated surface '$login-framework' (custom/components/login-framework.ts), '$custom/...' subpaths, bare npm packages, and type-only '@forgerock/journey-client/types'. Imports of '$core', '$journey', '$components', '$locales', other internal aliases, runtime '@forgerock/journey-client' imports, or paths escaping custom/components/ fail the build (boundary check). Use only the framework-documented props; do not add required props of your own. Render AM-derived messages as text — never render unsafe AM-derived HTML. See custom/components/README.md for the full guide.`;

const directoryParam = Schema.optional(Schema.String).annotations({
  description:
    'Path to the initialized project root (relative paths resolve against the server working directory). Defaults to the current working directory.',
});

const GenerateCallbackTool = Tool.make('generate_callback', {
  description:
    `Scaffold a new custom callback component under custom/components/callbacks/. Run from an initialized project root.` +
    AUTHORING_CONTRACT,
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
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false)
  .annotate(Tool.Idempotent, false);

const GenerateStageTool = Tool.make('generate_stage', {
  description:
    `Scaffold a new custom stage component under custom/components/stages/. Run from an initialized project root. Stage names are not constrained to PascalCase: any non-empty directory-safe string containing at least one letter is accepted (e.g. "DefaultLogin" or "My Login Stage"). The name is sanitized into a PascalCase identifier (letters and digits only, must start with a letter); edit the generated @component Name header to the exact AM Page Node stage name so the registry matches it at runtime. In the generated stage, submit through form.submit() — never the journey store — and treat journey.loading as authoritative.` +
    AUTHORING_CONTRACT,
  parameters: {
    name: Schema.String.annotations({
      description:
        'Stage name to scaffold from (e.g. "DefaultLogin" or "My Login Stage"). Sanitized into a PascalCase identifier; adjust the generated @component Name header to the exact AM stage name if they differ.',
    }),
    directory: directoryParam,
  },
  success: Schema.String,
  failure: Schema.String,
})
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false)
  .annotate(Tool.Idempotent, false);

const UpdateTool = Tool.make('update', {
  description:
    'Fetch the latest (or specified) framework version and overwrite core files while preserving the customer-owned custom/ tree (components, layout wrappers, README, demo). Run from an initialized project root.',
  parameters: {
    directory: directoryParam,
    version: Schema.optional(Schema.String).annotations({
      description:
        'Framework Git release tag to update to (e.g. @forgerock/login-widget@2.1.0 or v1.2.0; CLI flag: --tag). Defaults to main.',
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

export const handlerLayer = mcpToolkit.toLayer({
  init: ({ directory, version: ver, local }) =>
    catchToolErrors(
      initProject({
        directory,
        version: Option.fromNullable(ver),
        local: Option.fromNullable(local),
      }).pipe(
        Effect.map(
          () =>
            `Project initialized successfully in "${directory}".\n\n` +
            `Next steps:\n` +
            `  cd ${directory}\n` +
            `  pnpm install\n` +
            `  cp .env.example .env    # add your ForgeRock AM connection details\n` +
            `  pnpm dev\n\n` +
            `To scaffold your first custom component, use generate_callback or generate_stage.\n` +
            `Read the authoring guide: custom/components/README.md\n` +
            `Page wrappers to customize: custom/components/layout/header.svelte and footer.svelte`,
        ),
      ),
    ),

  generate_callback: ({ name, directory }) =>
    catchToolErrors(
      scaffoldComponent('callback', name, directory).pipe(
        Effect.map(() => {
          // F65: the raw name is model-controlled, so it reaches the tool
          // result only through safeNameForTerminal; the identifier named in
          // the text is the sanitized one the scaffold actually wrote.
          const identifier = parseComponentName(name);
          const displayName = Either.isRight(identifier)
            ? identifier.right
            : safeNameForTerminal(name);
          return `Callback component "${displayName}" scaffolded successfully under custom/components/callbacks/.`;
        }),
      ),
    ),

  generate_stage: ({ name, directory }) =>
    catchToolErrors(
      scaffoldComponent('stage', name, directory).pipe(
        Effect.map(() => {
          const identifier = parseComponentName(name);
          const displayName = Either.isRight(identifier)
            ? identifier.right
            : safeNameForTerminal(name);
          return `Stage component "${displayName}" scaffolded successfully under custom/components/stages/.`;
        }),
      ),
    ),

  update: ({ version: ver, local, directory }) =>
    catchToolErrors(
      // Delegate to the same pipeline the CLI update command runs so the
      // customer-sandbox guarantee (update never writes inside custom/) rests
      // on one tested implementation, not an inline copy.
      updateProject({
        directory: Option.fromNullable(directory),
        local: Option.fromNullable(local),
        tag: Option.fromNullable(ver),
      }).pipe(
        Effect.map(
          () =>
            `Update complete. Run "pnpm install" if dependencies changed. The customer-owned custom/ tree was preserved.`,
        ),
      ),
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
