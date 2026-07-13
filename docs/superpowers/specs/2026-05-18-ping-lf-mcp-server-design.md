# ping-lf MCP Server Design

**Date:** 2026-05-18  
**Status:** Approved

## Summary

Add `ping-lf --mcp` to the existing `@forgerock/login-framework-cli` package. When the flag is present, the binary boots a local MCP server over stdio instead of running the CLI. All tool logic delegates to the same Effect functions already used by the CLI commands — no duplication of business logic.

---

## Architecture

```
src/
├── main.ts          # modified: argv check → fork to mcp.ts or CLI path
├── mcp.ts           # new: McpServer layer + NodeRuntime.runMain
└── commands/
    ├── init.ts      # modified: export initProject() pure function
    ├── generate.ts  # modified: export scaffoldComponent()
    ├── update.ts    # unchanged (handler already callable)
    └── releases.ts  # unchanged
```

**Entrypoint fork:** `main.ts` checks `process.argv.includes('--mcp')` before constructing `Command.run`. If true, it dynamically imports `mcp.ts` and calls `runMcpServer()`. If false, it runs the existing CLI path unchanged.

`process.argv` is checked rather than a `@effect/cli` option because `Command.run` owns the lifecycle with no pre-parse hook, and this keeps `--mcp` out of `ping-lf --help`.

---

## Tool Definitions

Five MCP tools exposed by the server:

| Tool                | Parameters                                                | Delegates to                                             |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `init`              | `directory: string`, `version?: string`, `local?: string` | `initProject()` from `init.ts`                           |
| `generate_callback` | `name: string`                                            | `scaffoldComponent('callback', name)` from `generate.ts` |
| `generate_stage`    | `name: string`                                            | `scaffoldComponent('stage', name)` from `generate.ts`    |
| `update`            | `version?: string`, `local?: string`                      | `updateCommand` handler logic                            |
| `list_releases`     | _(none)_                                                  | `releasesCommand` handler logic                          |

All tools return `Schema.String` on success (a human-readable summary). Typed Effect errors (`InvalidVersionError`, `ComponentAlreadyExistsError`, etc.) are mapped to descriptive `Schema.String` failure values — the MCP client sees a structured error message rather than a process crash.

---

## `src/mcp.ts` Structure

```typescript
import { McpServer } from '@effect/ai';
import { Tool, Toolkit } from '@effect/ai';
import { NodeContext, NodeRuntime, NodeSink, NodeStream } from '@effect/platform-node';
import { Layer, Logger, Schema } from 'effect';

// Tool.make definitions (one per tool)
// Toolkit.make(...all tools...)
// McpServer.toolkit(theToolkit) → Layer
// Layer.mergeAll(toolkitLayer)
//   .pipe(Layer.provide(McpServer.layerStdio({ name, version, stdin, stdout })))
//   .pipe(Layer.provide(GithubReleaseLayer))
//   .pipe(Layer.provide(NodeContext.layer))
//   .pipe(Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))))

export const runMcpServer = () => Layer.launch(ServerLayer).pipe(NodeRuntime.runMain);
```

---

## stdout/stderr Split

`McpServer.layerStdio` owns stdout for the MCP JSON-RPC protocol. Any `Console.log` inside tool handlers would corrupt the stream. The server layer provides `Logger.prettyLogger({ stderr: true })` so all Effect log output goes to stderr and is invisible to the MCP client.

---

## Dependencies

**New:** `@effect/ai` must be added to `tools/cli/package.json` dependencies. The `McpServer`, `Tool`, and `Toolkit` modules all live in this package.

**Unchanged:** `@effect/platform-node` (already present) provides `NodeStream.stdin` and `NodeSink.stdout` for the stdio transport.

---

## project.cwd() Behavior

The MCP server inherits `process.cwd()` from its launcher (e.g., Claude Desktop's `mcp.json` config or `npx`). No `projectRoot` parameter is added to tools — same implicit-cwd contract as the CLI.

---

## Build

`tsconfig.json` already compiles all `src/**/*.ts`. `pnpm build` is unchanged. The new `src/mcp.ts` is compiled automatically.

---

## Usage (after implementation)

```jsonc
// .claude/mcp.json or Claude Desktop config
{
  "mcpServers": {
    "ping-lf": {
      "command": "npx",
      "args": ["@forgerock/login-framework-cli", "--mcp"],
      "cwd": "/path/to/your/login-project"
    }
  }
}
```

Or locally after build:

```sh
node dist/src/main.js --mcp
```
