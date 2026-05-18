# `ping-lf` — Ping Login Framework CLI

CLI for initializing, scaffolding, and updating Ping Login Widget and Login App custom component projects.

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9

## Installation

```sh
npm install -g @forgerock/login-framework-cli
```

Or run directly without installing:

```sh
npx @forgerock/login-framework-cli init my-project
```

## Commands

### `ping-lf init <directory>`

Bootstraps a new Login Widget or Login App project into `<directory>` by fetching the latest framework release from GitHub, copying it with safe exclusions, and setting up the custom component scaffolding.

```sh
ping-lf init my-login-project
cd my-login-project
pnpm install
cp .env.example .env   # fill in your ForgeRock AM details
pnpm dev
```

**Options**

| Flag              | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--version <tag>` | Download a specific release (e.g. `v1.2.0`). Defaults to latest.                                                       |
| `--local <path>`  | Use a local framework directory instead of downloading from GitHub. Useful for development or air-gapped environments. |

**What it does**

1. Downloads the framework archive from GitHub Releases (or copies from `--local`)
2. Copies framework files, excluding build artifacts, secrets, and `tools/`
3. Writes a minimal `pnpm-workspace.yaml`
4. Creates `experimental/custom/callbacks/` and `experimental/custom/stages/` with `.gitkeep` placeholders
5. Copies the component authoring guide to `experimental/custom/README.md`
6. Seeds an empty `core/journey/_utilities/custom-registry.ts`
7. Injects the custom registry Vite plugin into widget and app configs
8. Writes `.generator-version` to track the framework version in use

---

### `ping-lf generate callback <Name>`

### `ping-lf generate stage <Name>`

Scaffolds a new custom component under `experimental/custom/callbacks/<slug>/` or `experimental/custom/stages/<slug>/`, then regenerates `custom-registry.ts`.

Run from the root of an initialized project.

```sh
# Override the built-in NameCallback renderer
ping-lf generate callback NameCallback

# Override the DefaultLogin stage layout
ping-lf generate stage DefaultLogin

# Create a brand-new callback type (paired with a custom AM node)
ping-lf generate callback MyTelemetryCallback
```

**What it creates** (example for `ping-lf generate callback NameCallback`):

```
experimental/custom/callbacks/name-callback/
├── name-callback.svelte          # component implementation — edit this
└── name-callback.utilities.ts    # helper functions (optional)
└── name-callback.utilities.test.ts  # unit test stub
```

The `@component` header in the generated `.svelte` file declares the type and name. The pre-build script and `ping-lf` both read this header to register the component:

```svelte
<!--
@component
Type: callback
Name: NameCallback
-->
```

Setting `Name` to an existing default (e.g. `NameCallback`, `DefaultLogin`) **overrides** that component. Setting it to a new name **extends** the framework with a custom type.

See `experimental/custom/README.md` for the full prop contract.

---

### `ping-lf releases`

Lists available framework releases from GitHub.

```sh
ping-lf releases
```

---

### `ping-lf --mcp`

Boots the CLI as a local **MCP server** over stdio instead of running the CLI. Exposes the same four commands as typed tools that any MCP-compatible AI assistant can call directly.

#### Claude Code (project-local)

Create `.claude/mcp.json` at the root of your login project:

```jsonc
{
  "mcpServers": {
    "ping-lf": {
      "command": "npx",
      "args": ["@forgerock/login-framework-cli", "--mcp"]
    }
  }
}
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```jsonc
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

#### Available tools

| Tool                | Description                              |
| ------------------- | ---------------------------------------- |
| `init`              | Bootstrap a new project (`init` command) |
| `generate_callback` | Scaffold a custom callback component     |
| `generate_stage`    | Scaffold a custom stage component        |
| `update`            | Update the framework version             |
| `list_releases`     | List available releases from GitHub      |

The server inherits `cwd` from the process that launched it. For `generate_callback`, `generate_stage`, and `update`, that must be the root of an initialized project.

---

### `ping-lf update`

Fetches the latest (or a specified) framework version and overwrites the core framework files while **preserving** `experimental/custom/` and project-level configs. Regenerates the component registry after the update.

Run from the root of an initialized project.

```sh
ping-lf update                     # update to latest
ping-lf update --version v1.5.0    # pin to a specific version
ping-lf update --local ../framework # use a local directory
```

**What it preserves**

- `experimental/custom/` — all custom components are untouched
- `pnpm-workspace.yaml` — your workspace config is not overwritten
- `.env` files — excluded from the copy

**After updating**, run `pnpm install` if the framework's package dependencies changed.

---

## Project layout (after `init`)

```
my-login-project/
├── packages/login-widget/        # @forgerock/login-widget
├── apps/login-app/               # SvelteKit dev/docs app
├── core/                         # Shared stores, components, journey logic
│   └── journey/_utilities/
│       └── custom-registry.ts    # AUTO-GENERATED — do not edit
├── experimental/
│   └── custom/
│       ├── README.md             # Component authoring guide
│       ├── callbacks/            # Your custom callback components
│       └── stages/               # Your custom stage components
├── .generator-version            # Tracks the framework version in use
└── pnpm-workspace.yaml
```

## Development

> **All commands below must be run from the `tools/cli/` directory.**

```sh
cd tools/cli

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run tests
pnpm test

# Watch mode (rebuild on file changes)
pnpm dev
```

### Running locally without installing globally

```sh
# From tools/cli/ after pnpm build:
node dist/main.js init my-project

# Or from anywhere using the full path:
node /path/to/forgerock-web-login-framework/tools/cli/dist/main.js init my-project
```

### Project structure

```
tools/cli/
├── src/
│   ├── main.ts                   # Entry point — forks to MCP server or CLI
│   ├── mcp.ts                    # MCP server (ping-lf --mcp)
│   ├── errors.ts                 # Typed Effect errors
│   ├── commands/
│   │   ├── init.ts               # ping-lf init
│   │   ├── generate.ts           # ping-lf generate callback|stage
│   │   └── update.ts             # ping-lf update
│   ├── services/
│   │   ├── file-system.ts        # copyWithExclusions
│   │   ├── registry.ts           # component scanning + registry generation
│   │   ├── release.ts            # GitHub release fetch
│   │   └── vite-config.ts        # Vite plugin injection
│   └── config/
│       ├── exclusions.ts         # Files/dirs excluded from copy operations
│       └── version.ts            # .generator-version read/write
├── templates/
│   ├── callback/                 # Scaffold templates for callbacks
│   └── stage/                    # Scaffold templates for stages
└── test/                         # Vitest unit tests
```

### Tech stack

- **[Effect](https://effect.website/)** — typed async handling, composable services, declarative errors
- **[@effect/cli](https://github.com/Effect-TS/effect/tree/main/packages/cli)** — CLI parsing and help generation
- **[@effect/ai](https://github.com/Effect-TS/effect/tree/main/packages/ai)** — MCP server (`McpServer`, `Tool`, `Toolkit`)
- **[@effect/platform-node](https://github.com/Effect-TS/effect/tree/main/packages/platform-node)** — Node.js FileSystem, Path, HTTP client
- **[Vitest](https://vitest.dev/)** — unit tests
