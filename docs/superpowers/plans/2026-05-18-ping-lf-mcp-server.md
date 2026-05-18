# ping-lf MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `ping-lf --mcp` to the existing CLI binary; when present it boots a local MCP server over stdio that exposes the CLI's four commands as five typed tools.

**Architecture:** Before `Command.run` is invoked in `main.ts`, `process.argv` is checked for `--mcp`. If found, `runMcpServer()` from `src/mcp.ts` is called instead. `src/mcp.ts` builds a `McpServer.layerStdio` layer composed with a `Toolkit` whose handlers delegate directly to the extracted command logic from the existing `commands/` modules.

**Tech Stack:** `@effect/ai` (McpServer, Tool, Toolkit), `@effect/platform-node` (NodeStream.stdin, NodeSink.stdout), `effect` (Layer, Schema, Logger), `@effect/cli` (unchanged)

---

## File Map

| File                                 | Change                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| `tools/cli/package.json`             | Add `@effect/ai@^0.35.0` dependency                             |
| `tools/cli/src/commands/init.ts`     | Export `initProject(opts)` pure function                        |
| `tools/cli/src/commands/generate.ts` | Export `scaffoldComponent` (currently unexported)               |
| `tools/cli/src/mcp.ts`               | **New** — MCP server entry, tool definitions, layer composition |
| `tools/cli/src/main.ts`              | Add `--mcp` argv check before `Command.run`                     |
| `tools/cli/test/mcp.test.ts`         | **New** — unit tests for MCP tool handler logic                 |

---

### Task 1: Add `@effect/ai` dependency

**Files:**

- Modify: `tools/cli/package.json`

- [ ] **Step 1: Add the dependency**

In `tools/cli/package.json`, add to the `"dependencies"` object (after `"effect"`):

```json
"@effect/ai": "^0.35.0",
```

- [ ] **Step 2: Install**

Run from repo root:

```sh
pnpm install
```

Expected: `packages/login-widget` and root install succeeds with no peer dep warnings about `@effect/ai`.

- [ ] **Step 3: Verify the package resolves**

```sh
node -e "import('@effect/ai/McpServer').then(m => console.log(Object.keys(m)))" --input-type=module 2>&1 | head -5
```

Expected: prints a list of exported names including `layerStdio` (or similar). No `MODULE_NOT_FOUND` error.

- [ ] **Step 4: Commit**

```sh
git add tools/cli/package.json pnpm-lock.yaml
git commit -m "chore(cli): add @effect/ai dependency for MCP server"
```

---

### Task 2: Export `scaffoldComponent` from `generate.ts`

**Files:**

- Modify: `tools/cli/src/commands/generate.ts`

The `scaffoldComponent` function is currently an unexported local function. It must be exported so `mcp.ts` can call it directly.

- [ ] **Step 1: Write a failing test that imports `scaffoldComponent`**

Create `tools/cli/test/mcp.test.ts`:

```typescript
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { scaffoldComponent } from '../src/commands/generate.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-mcp-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const run = <A, E>(eff: Effect.Effect<A, E, never>) =>
  Effect.runPromise(Effect.provide(eff as any, NodeContext.layer));

describe('scaffoldComponent (exported)', () => {
  it('is exported from generate.ts', () => {
    expect(typeof scaffoldComponent).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: FAIL — `scaffoldComponent` is not exported.

- [ ] **Step 3: Export `scaffoldComponent`**

In `tools/cli/src/commands/generate.ts`, change:

```typescript
function scaffoldComponent(type: 'callback' | 'stage', name: string) {
```

to:

```typescript
export function scaffoldComponent(type: 'callback' | 'stage', name: string) {
```

- [ ] **Step 4: Run the test, verify it passes**

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add tools/cli/src/commands/generate.ts tools/cli/test/mcp.test.ts
git commit -m "feat(cli): export scaffoldComponent for MCP server reuse"
```

---

### Task 3: Extract `initProject` from `init.ts`

**Files:**

- Modify: `tools/cli/src/commands/init.ts`

The `initCommand` body is an inline `Effect.gen`. Extract it into an exported `initProject` function so `mcp.ts` can call it without going through `@effect/cli`.

- [ ] **Step 1: Write a failing test that imports `initProject`**

Add to `tools/cli/test/mcp.test.ts` (inside the same file, after the existing describe block):

```typescript
import { initProject } from '../src/commands/init.js';

describe('initProject (exported)', () => {
  it('is exported from init.ts', () => {
    expect(typeof initProject).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: FAIL — `initProject` is not exported.

- [ ] **Step 3: Extract and export `initProject`**

In `tools/cli/src/commands/init.ts`, before the `initCommand` declaration, add:

```typescript
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

    const resolvedVersion = yield* Effect.scoped(
      Effect.gen(function* () {
        const { sourceDir, resolvedVersion } = yield* resolveSource(local, version, resolvedDir);

        yield* Console.log('Copying framework files...');
        yield* fs.makeDirectory(resolvedDir, { recursive: true });
        yield* copyWithExclusions(sourceDir, resolvedDir);

        return resolvedVersion;
      }),
    );

    yield* fs.writeFileString(path.join(resolvedDir, 'pnpm-workspace.yaml'), PNPM_WORKSPACE);

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

    yield* Console.log('Generating custom component registry...');
    yield* runRegistryScript(resolvedDir);

    yield* writeVersion(resolvedDir, {
      version: resolvedVersion,
      commitHash: '',
      generatedAt: new Date().toISOString(),
    });

    yield* Console.log(nextStepsMessage(directory));
  });
```

Then update `initCommand` to delegate to `initProject`:

```typescript
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
  },
  ({ directory, local, version }) => initProject({ directory, local, version }),
).pipe(
  Command.withDescription(
    'Bootstrap a new Ping Login Widget or Login App project from a GitHub release or a local framework path.',
  ),
);
```

You also need to add the `Option` import at the top if not already present:

```typescript
import { Console, Effect, Option } from 'effect';
```

- [ ] **Step 4: Run the test, verify it passes**

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```sh
cd tools/cli && pnpm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```sh
git add tools/cli/src/commands/init.ts tools/cli/test/mcp.test.ts
git commit -m "feat(cli): extract initProject function for MCP server reuse"
```

---

### Task 4: Create `src/mcp.ts` — MCP server entry point

**Files:**

- Create: `tools/cli/src/mcp.ts`

This is the main MCP server implementation. It defines five tools, wires their handlers to the existing command logic, and exports `runMcpServer()`.

- [ ] **Step 1: Write a failing test for the MCP tool names**

Add to `tools/cli/test/mcp.test.ts`:

```typescript
import { Toolkit, Tool } from '@effect/ai';
import { Schema } from 'effect';

describe('MCP tools', () => {
  it('defines five tools with correct names', async () => {
    const { mcpToolkit } = await import('../src/mcp.js');
    const toolNames = Object.keys((mcpToolkit as any)['tools']);
    expect(toolNames.sort()).toEqual(
      ['generate_callback', 'generate_stage', 'init', 'list_releases', 'update'].sort(),
    );
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: FAIL — `../src/mcp.js` does not exist.

- [ ] **Step 3: Create `src/mcp.ts`**

Create `tools/cli/src/mcp.ts`:

```typescript
import { McpServer, Tool, Toolkit } from '@effect/ai';
import { Effect, Layer, Logger, Option, Schema } from 'effect';
import { NodeContext, NodeRuntime, NodeSink, NodeStream } from '@effect/platform-node';
import { createRequire } from 'node:module';

import { initProject } from './commands/init.js';
import { scaffoldComponent } from './commands/generate.js';
import { assertValidProject, writeVersion } from './config/version.js';
import { copyWithExclusions } from './services/file-system.js';
import { runRegistryScript } from './services/registry.js';
import { resolveSource } from './commands/source.js';
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
      version: ver !== undefined ? Option.some(ver) : Option.none(),
      local: local !== undefined ? Option.some(local) : Option.none(),
    }).pipe(
      Effect.map(() => `Project initialized successfully in "${directory}".`),
      Effect.catchAll((err) => Effect.fail(String(err))),
    ),

  generate_callback: ({ name }) =>
    scaffoldComponent('callback', name).pipe(
      Effect.map(() => `Callback component "${name}" scaffolded successfully.`),
      Effect.catchAll((err) => Effect.fail(String(err))),
    ),

  generate_stage: ({ name }) =>
    scaffoldComponent('stage', name).pipe(
      Effect.map(() => `Stage component "${name}" scaffolded successfully.`),
      Effect.catchAll((err) => Effect.fail(String(err))),
    ),

  update: ({ version: ver, local }) =>
    Effect.gen(function* () {
      const cwd = process.cwd();
      const currentVersion = yield* assertValidProject(cwd);

      const resolvedVersion = yield* Effect.scoped(
        Effect.gen(function* () {
          const { sourceDir, resolvedVersion } = yield* resolveSource(
            local !== undefined ? Option.some(local) : Option.none(),
            ver !== undefined ? Option.some(ver) : Option.none(),
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
    }).pipe(Effect.catchAll((err) => Effect.fail(String(err)))),

  list_releases: () =>
    Effect.gen(function* () {
      const release = yield* Release;
      const releases = yield* release.listReleases();
      return releases.map(({ tag, publishedAt }) => `${tag.padEnd(10)} ${publishedAt}`).join('\n');
    }).pipe(Effect.catchAll((err) => Effect.fail(String(err)))),
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
  Layer.provide(GithubReleaseLayer),
  Layer.provide(NodeContext.layer),
  Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
);

export const runMcpServer = () => Layer.launch(ServerLayer).pipe(NodeRuntime.runMain);
```

- [ ] **Step 4: Run the test, verify it passes**

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: PASS — the five tool names are present.

- [ ] **Step 5: Commit**

```sh
git add tools/cli/src/mcp.ts tools/cli/test/mcp.test.ts
git commit -m "feat(cli): add MCP server with five tools mirroring CLI commands"
```

---

### Task 5: Wire `--mcp` flag in `main.ts`

**Files:**

- Modify: `tools/cli/src/main.ts`

- [ ] **Step 1: Write a failing test for the argv branch**

Add to `tools/cli/test/mcp.test.ts`:

```typescript
describe('--mcp argv detection', () => {
  it('runMcpServer is exported from mcp.ts', async () => {
    const { runMcpServer } = await import('../src/mcp.js');
    expect(typeof runMcpServer).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test, verify it passes already** (it just checks the export exists)

```sh
cd tools/cli && pnpm exec vitest run test/mcp.test.ts
```

Expected: PASS (runMcpServer already exported from Task 4).

- [ ] **Step 3: Add the `--mcp` fork to `main.ts`**

In `tools/cli/src/main.ts`, at the very top after the imports (before the `rootCommand` declaration), add:

```typescript
if (process.argv.includes('--mcp')) {
  const { runMcpServer } = await import('./mcp.js');
  runMcpServer();
  process.exit(0);
}
```

The full file after modification:

```typescript
#!/usr/bin/env node
import { Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect } from 'effect';
import { createRequire } from 'node:module';

import { generateCommand } from './commands/generate.js';
import { initCommand } from './commands/init.js';
import { releasesCommand } from './commands/releases.js';
import { updateCommand } from './commands/update.js';
import { GithubReleaseLayer } from './services/release.js';

if (process.argv.includes('--mcp')) {
  const { runMcpServer } = await import('./mcp.js');
  runMcpServer();
  process.exit(0);
}

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

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
  Effect.provide(GithubReleaseLayer),
  Effect.provide(NodeContext.layer),
  (effect) => NodeRuntime.runMain(effect, { disableErrorReporting: true }),
);
```

- [ ] **Step 4: Build and smoke-test `--mcp`**

```sh
cd tools/cli && pnpm build
```

Expected: build succeeds with no TypeScript errors.

Then verify the flag is recognized (server starts and waits for stdin; Ctrl-C to exit):

```sh
echo '{}' | node dist/src/main.js --mcp
```

Expected: process starts (MCP server boot), writes JSON to stdout, then exits (or waits). No crash, no "unknown flag" error.

- [ ] **Step 5: Verify normal CLI still works**

```sh
node dist/src/main.js --help
```

Expected: shows the normal `ping-lf` help text with `init`, `generate`, `update`, `releases` subcommands. No mention of `--mcp`.

- [ ] **Step 6: Run full test suite**

```sh
cd tools/cli && pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```sh
git add tools/cli/src/main.ts
git commit -m "feat(cli): add --mcp flag to boot MCP server over stdio"
```

---

### Task 6: Verify MCP server with a real client handshake

This is a manual integration check — no automated test needed. Verifies the server speaks the MCP protocol correctly.

- [ ] **Step 1: Build**

```sh
cd tools/cli && pnpm build
```

- [ ] **Step 2: Send an MCP `initialize` request and read the response**

```sh
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.0.1"}}}' \
  | node dist/src/main.js --mcp
```

Expected: a JSON response like:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "ping-lf", "version": "0.1.0" }
  }
}
```

- [ ] **Step 3: Send a `tools/list` request**

```sh
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.0.1"}}}\n{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n' \
  | node dist/src/main.js --mcp
```

Expected: second response contains the five tool names: `init`, `generate_callback`, `generate_stage`, `update`, `list_releases`.

- [ ] **Step 4: If the server does not start correctly, debug**

Check stderr for Effect logger output. If `McpServer.toolkit` or `Toolkit.toLayer` API has changed from what's documented, adjust `src/mcp.ts` accordingly using:

```sh
node -e "import('@effect/ai/McpServer').then(m => console.log(Object.keys(m)))" --input-type=module
node -e "import('@effect/ai/Toolkit').then(m => console.log(Object.keys(m)))" --input-type=module
```

- [ ] **Step 5: Final commit**

```sh
git add -p   # review any debug changes
git commit -m "fix(cli): adjust MCP server layer composition after integration test"
```

(Skip this step if no changes were needed.)
