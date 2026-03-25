# Login Widget Generator CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool (`ping-law generate` / `ping-law update`) that scaffolds and updates customer repositories with framework code while preserving the `/user` directory for custom components.

**Architecture:** A new `tools/cli` package using `@effect/cli` and `@effect/platform-node` for typed argument parsing and filesystem operations. The CLI pulls framework source from a tagged release (tarball or git archive), copies it into the target directory while respecting an exclusion list, scaffolds the `/user` directory with demo components, and generates a basic CI workflow. The `update` command overwrites framework code but never touches `/user/`.

**Tech Stack:** Effect (`effect`, `@effect/cli`, `@effect/platform`, `@effect/platform-node`), TypeScript, Node.js

---

## File Structure

```
tools/cli/
├── package.json                    # @forgerock/login-widget-generator
├── tsconfig.json                   # Strict, ESNext, NodeNext
├── vitest.config.ts
├── src/
│   ├── main.ts                     # CLI entry point — defines root command + subcommands
│   ├── commands/
│   │   ├── generate.ts             # `ping-law generate` command
│   │   ├── update.ts               # `ping-law update` command
│   │   └── scan.ts                 # `ping-law scan` — pre-build registry regeneration
│   ├── services/
│   │   ├── FileSystem.ts           # Copy with exclusion logic using @effect/platform
│   │   ├── Release.ts              # Fetches and extracts framework releases (tarball)
│   │   └── Registry.ts             # Generates custom-registry.ts from /user directory scan
│   ├── config/
│   │   ├── exclusions.ts           # Files/dirs excluded from generation (CI, .changeset, etc.)
│   │   └── version.ts              # Version manifest type + read/write .generator-version
│   └── errors.ts                   # TaggedError definitions
├── templates/
│   ├── ci/
│   │   └── ci.yml.ts               # Basic GitHub Actions CI workflow template
│   ├── user/
│   │   ├── stage/
│   │   │   └── demo-stage/
│   │   │       ├── component.svelte    # Demo stage component
│   │   │       ├── utility.ts          # Demo utility
│   │   │       ├── utility.test.ts     # Demo unit test
│   │   │       ├── component.stories.ts
│   │   │       └── component.story.svelte
│   │   └── callback/
│   │       └── demo-callback/
│   │           ├── component.svelte    # Demo callback component
│   │           ├── utility.ts
│   │           ├── utility.test.ts
│   │           ├── component.stories.ts
│   │           └── component.story.svelte
│   └── env.example.ts              # .env.example template
└── test/
    ├── generate.test.ts            # Generate command tests
    ├── update.test.ts              # Update command tests
    ├── config/
    │   └── exclusions.test.ts
    ├── services/
    │   ├── FileSystem.test.ts
    │   ├── Release.test.ts
    │   └── Registry.test.ts
    └── e2e/
        └── smoke.test.ts           # End-to-end scaffolding tests
```

**Modifications to existing files:**

```
core/journey/_utilities/callback-mapper.svelte   # Import + merge custom callback registry
core/journey/_utilities/map-stage.utilities.ts    # Import + merge custom stage registry
core/journey/_utilities/custom-registry.ts        # NEW — generated file (empty default, populated by pre-build)
pnpm-workspace.yaml                              # Add tools/* to workspaces
package.json                                      # Add `ping-law` script
.gitignore                                        # Add custom-registry.ts to gitignore (generated)
```

---

### Task 1: Bootstrap the CLI Package

**Files:**

- Create: `tools/cli/package.json`
- Create: `tools/cli/tsconfig.json`
- Create: `tools/cli/vitest.config.ts`
- Create: `tools/cli/src/errors.ts`
- Create: `tools/cli/src/main.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json` (root)

- [ ] **Step 1: Add `tools/*` to pnpm workspaces**

In `pnpm-workspace.yaml`, add `'tools/*'` to the packages array:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'e2e'
  - 'tools/*'

overrides:
  vite>rollup: 'npm:@rollup/wasm-node'
```

- [ ] **Step 2: Create `tools/cli/package.json`**

```json
{
  "name": "@forgerock/login-widget-generator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "ping-law": "./dist/main.js"
  },
  "scripts": {
    "build": "tsc && cp -r templates dist/templates",
    "dev": "tsc --watch",
    "test": "vitest"
  },
  "dependencies": {
    "effect": "^3.14.0",
    "@effect/cli": "^0.54.0",
    "@effect/platform": "^0.78.0",
    "@effect/platform-node": "^0.74.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vitest": "^3.0.0"
  }
}
```

> **Note:** Pin exact Effect ecosystem versions after running `pnpm install` to ensure compatibility across the effect/cli/platform triple. Check latest compatible versions at install time.

- [ ] **Step 3: Create `tools/cli/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `tools/cli/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 5: Create error types in `tools/cli/src/errors.ts`**

```ts
import { Data } from 'effect';

export class ReleaseNotFoundError extends Data.TaggedError('ReleaseNotFoundError')<{
  readonly version: string;
  readonly cause?: unknown;
}> {}

export class FileSystemError extends Data.TaggedError('FileSystemError')<{
  readonly operation: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class GeneratorVersionError extends Data.TaggedError('GeneratorVersionError')<{
  readonly message: string;
  readonly path?: string;
}> {}

export class RegistryScanError extends Data.TaggedError('RegistryScanError')<{
  readonly directory: string;
  readonly cause?: unknown;
}> {}
```

- [ ] **Step 6: Create minimal CLI entry point in `tools/cli/src/main.ts`**

```ts
import { Command } from '@effect/cli';
import { Effect } from 'effect';
import { NodeContext, NodeRuntime } from '@effect/platform-node';

const generate = Command.make('generate', {}, () => Effect.log('generate: not yet implemented'));

const update = Command.make('update', {}, () => Effect.log('update: not yet implemented'));

const command = Command.make('ping-law').pipe(Command.withSubcommands([generate, update]));

const cli = Command.run(command, {
  name: 'ping-law',
  version: '0.1.0',
});

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
```

- [ ] **Step 7: Install dependencies and verify build**

```bash
pnpm install
cd tools/cli && pnpm build
```

Expected: Compiles to `tools/cli/dist/main.js` with no errors.

- [ ] **Step 8: Add root-level convenience script**

In root `package.json`, add to `scripts`:

```json
"ping-law": "pnpm --filter @forgerock/login-widget-generator build && node tools/cli/dist/main.js"
```

- [ ] **Step 9: Verify CLI runs**

```bash
pnpm ping-law -- --help
```

Expected: Shows help output with `generate` and `update` subcommands.

- [ ] **Step 10: Commit**

```bash
git add tools/cli/ pnpm-workspace.yaml package.json
git commit -m "feat(cli): bootstrap ping-law CLI package with @effect/cli"
```

---

### Task 2: Exclusion Config and Version Manifest

**Files:**

- Create: `tools/cli/src/config/exclusions.ts`
- Create: `tools/cli/src/config/version.ts`
- Create: `tools/cli/test/config/exclusions.test.ts`

- [ ] **Step 1: Write failing tests for exclusion matching**

Create `tools/cli/test/config/exclusions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isExcluded } from '../../src/config/exclusions.js';

describe('isExcluded', () => {
  it('excludes .github/workflows directory', () => {
    expect(isExcluded('.github/workflows/ci.yml')).toBe(true);
    expect(isExcluded('.github/workflows/release.yml')).toBe(true);
  });

  it('excludes .changeset directory', () => {
    expect(isExcluded('.changeset/config.json')).toBe(true);
  });

  it('excludes internal config files', () => {
    expect(isExcluded('.claude/')).toBe(true);
    expect(isExcluded('CLAUDE.md')).toBe(true);
    expect(isExcluded('.mcp.json')).toBe(true);
  });

  it('excludes git and lock files', () => {
    expect(isExcluded('.git/HEAD')).toBe(true);
    expect(isExcluded('pnpm-lock.yaml')).toBe(true);
    expect(isExcluded('.env')).toBe(true);
  });

  it('excludes node_modules and build output', () => {
    expect(isExcluded('node_modules/foo/bar.js')).toBe(true);
    expect(isExcluded('packages/login-widget/dist/index.js')).toBe(true);
    expect(isExcluded('storybook-static/index.html')).toBe(true);
  });

  it('preserves framework source code', () => {
    expect(isExcluded('core/journey/journey.svelte')).toBe(false);
    expect(isExcluded('packages/login-widget/package.json')).toBe(false);
    expect(isExcluded('apps/login-app/src/routes/+page.svelte')).toBe(false);
  });

  it('preserves config files needed by customers', () => {
    expect(isExcluded('tsconfig.json')).toBe(false);
    expect(isExcluded('.npmrc')).toBe(false);
    expect(isExcluded('eslint.config.js')).toBe(false);
    expect(isExcluded('.prettierrc')).toBe(false);
    expect(isExcluded('postcss.config.cjs')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement exclusions config**

Create `tools/cli/src/config/exclusions.ts`:

```ts
/**
 * Paths excluded from framework generation/update.
 * These are either internal CI, build artifacts, or files
 * that should be customer-managed.
 */
const EXCLUDED_PREFIXES = [
  '.git/',
  '.github/',
  '.changeset/',
  '.claude/',
  '.husky/',
  '.vscode/',
  '.playwright-mcp/',
  'node_modules/',
  'storybook-static/',
  'packages/login-widget/dist/',
  'packages/login-widget/svelte-package/',
  'apps/login-app/build/',
  'apps/login-app/.svelte-kit/',
  'e2e/test-results/',
  'e2e/playwright-report/',
  'e2e/blob-report/',
  'docs/',
  'specs/',
] as const;

const EXCLUDED_FILES = [
  '.env',
  '.mcp.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'CLAUDE.md',
  '.generator-version',
] as const;

const EXCLUDED_PATTERNS = [
  /^\.env\..*/, // .env.* (but not .env.example)
  /\.d\.ts$/, // Generated type declarations in core/
] as const;

const ALLOW_LIST = ['.env.example', '.env.docker.example'] as const;

export function isExcluded(relativePath: string): boolean {
  // Allow-listed files always pass through
  if (ALLOW_LIST.some((allowed) => relativePath === allowed)) {
    return false;
  }

  // Check exact file matches
  if (EXCLUDED_FILES.some((file) => relativePath === file)) {
    return true;
  }

  // Check prefix matches (directories)
  if (EXCLUDED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return true;
  }

  // Check pattern matches
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(relativePath))) {
    return true;
  }

  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: All `isExcluded` tests PASS.

- [ ] **Step 5: Write version manifest module**

Create `tools/cli/src/config/version.ts`:

```ts
import { Effect } from 'effect';
import { FileSystem } from '@effect/platform';
import { GeneratorVersionError } from '../errors.js';

export interface GeneratorVersion {
  readonly version: string;
  readonly commitHash: string;
  readonly generatedAt: string;
}

const VERSION_FILE = '.generator-version';

export const readVersion = (directory: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const filePath = `${directory}/${VERSION_FILE}`;
    const exists = yield* fs.exists(filePath);

    if (!exists) {
      return yield* new GeneratorVersionError({
        message: 'No .generator-version file found. Is this a generated project?',
        path: filePath,
      });
    }

    const content = yield* fs.readFileString(filePath);
    return yield* Effect.try({
      try: () => JSON.parse(content) as GeneratorVersion,
      catch: (cause) =>
        new GeneratorVersionError({
          message: 'Malformed .generator-version file',
          path: filePath,
        }),
    });
  });

export const writeVersion = (directory: string, version: GeneratorVersion) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const filePath = `${directory}/${VERSION_FILE}`;
    yield* fs.writeFileString(filePath, JSON.stringify(version, null, 2) + '\n');
  });
```

- [ ] **Step 6: Commit**

```bash
git add tools/cli/src/config/ tools/cli/test/
git commit -m "feat(cli): add exclusion config and version manifest"
```

---

### Task 3: Release Service — Fetch and Extract Framework Source

**Files:**

- Create: `tools/cli/src/services/Release.ts`
- Create: `tools/cli/test/services/Release.test.ts`

- [ ] **Step 1: Write failing test for release service**

Create `tools/cli/test/services/Release.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Effect } from 'effect';
import { Release, ReleaseLive } from '../../src/services/Release.js';

describe('Release', () => {
  it('constructs a GitHub archive URL from a version tag', () =>
    Effect.gen(function* () {
      const release = yield* Release;
      const url = release.archiveUrl('v1.0.0');
      expect(url).toBe(
        'https://github.com/ForgeRock/forgerock-web-login-framework/archive/refs/tags/v1.0.0.tar.gz',
      );
    }).pipe(Effect.provide(ReleaseLive), Effect.runPromise));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Release service**

Create `tools/cli/src/services/Release.ts`:

```ts
import { Context, Effect, Layer } from 'effect';
import { Command } from '@effect/platform';
import { ReleaseNotFoundError } from '../errors.js';

const REPO = 'ForgeRock/forgerock-web-login-framework';

/** Strict version format: v1.0.0, 1.0.0, v1.0.0-beta.1, etc. */
const VERSION_REGEX = /^v?\d+\.\d+\.\d+(-[\w.]+)?$/;

function validateVersion(version: string): Effect.Effect<string, ReleaseNotFoundError> {
  return VERSION_REGEX.test(version)
    ? Effect.succeed(version)
    : Effect.fail(
        new ReleaseNotFoundError({
          version,
          cause: `Invalid version format: "${version}". Expected semver like v1.0.0`,
        }),
      );
}

export class Release extends Context.Tag('Release')<
  Release,
  {
    readonly archiveUrl: (version: string) => string;
    readonly fetch: (
      version: string,
      targetDir: string,
    ) => Effect.Effect<string, ReleaseNotFoundError>;
  }
>() {}

export const ReleaseLive = Layer.succeed(Release, {
  archiveUrl: (version: string) => `https://github.com/${REPO}/archive/refs/tags/${version}.tar.gz`,

  fetch: (version, targetDir) =>
    Effect.gen(function* () {
      // Validate version format before using in subprocess args
      yield* validateVersion(version);

      const url = `https://github.com/${REPO}/archive/refs/tags/${version}.tar.gz`;
      const tempDir = `${targetDir}/.framework-tmp`;

      yield* Command.make('mkdir', '-p', tempDir).pipe(
        Command.exitCode,
        Effect.mapError((cause) => new ReleaseNotFoundError({ version, cause })),
      );

      // Separate curl and tar commands to avoid sh -c interpolation
      const curlCmd = Command.make('curl', '-sfL', '-o', `${tempDir}/release.tar.gz`, url);
      yield* curlCmd.pipe(
        Command.exitCode,
        Effect.mapError((cause) => new ReleaseNotFoundError({ version, cause })),
      );

      const tarCmd = Command.make(
        'tar',
        'xz',
        '-C',
        tempDir,
        '--strip-components=1',
        '-f',
        `${tempDir}/release.tar.gz`,
      );
      yield* tarCmd.pipe(
        Command.exitCode,
        Effect.mapError((cause) => new ReleaseNotFoundError({ version, cause })),
      );

      return tempDir;
    }),
});
```

> **Note:** Version string is validated against a strict regex before use. `curl` and `tar` are invoked as separate commands with explicit arguments (no `sh -c` interpolation) to prevent shell injection.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: URL construction test PASS. (Network-dependent fetch is integration-level.)

- [ ] **Step 5: Commit**

```bash
git add tools/cli/src/services/Release.ts tools/cli/test/services/Release.test.ts
git commit -m "feat(cli): add Release service for fetching framework tarballs"
```

---

### Task 4: FileSystem Service — Copy with Exclusions

**Files:**

- Create: `tools/cli/src/services/FileSystem.ts`
- Create: `tools/cli/test/services/FileSystem.test.ts`

- [ ] **Step 1: Write failing test for copy with exclusions**

Create `tools/cli/test/services/FileSystem.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { NodeContext } from '@effect/platform-node';
import { copyWithExclusions } from '../../src/services/FileSystem.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('copyWithExclusions', () => {
  let sourceDir: string;
  let targetDir: string;

  beforeEach(() => {
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-src-'));
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-tgt-'));

    // Create source structure
    fs.mkdirSync(path.join(sourceDir, 'core/journey'), { recursive: true });
    fs.mkdirSync(path.join(sourceDir, '.github/workflows'), { recursive: true });
    fs.mkdirSync(path.join(sourceDir, '.changeset'), { recursive: true });

    fs.writeFileSync(path.join(sourceDir, 'core/journey/journey.svelte'), '<p>framework</p>');
    fs.writeFileSync(path.join(sourceDir, '.github/workflows/ci.yml'), 'name: CI');
    fs.writeFileSync(path.join(sourceDir, '.changeset/config.json'), '{}');
    fs.writeFileSync(path.join(sourceDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(sourceDir, 'tsconfig.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('copies non-excluded files', () =>
    copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.andThen(() => {
        expect(fs.existsSync(path.join(targetDir, 'core/journey/journey.svelte'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'tsconfig.json'))).toBe(true);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('skips excluded files', () =>
    copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.andThen(() => {
        expect(fs.existsSync(path.join(targetDir, '.github/workflows/ci.yml'))).toBe(false);
        expect(fs.existsSync(path.join(targetDir, '.changeset/config.json'))).toBe(false);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('never overwrites /user directory', () => {
    // Pre-create user content in target
    fs.mkdirSync(path.join(targetDir, 'user/callback/my-cb'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'user/callback/my-cb/component.svelte'), 'custom');

    // Source has no /user (framework source won't have it)
    return copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.andThen(() => {
        expect(
          fs.readFileSync(path.join(targetDir, 'user/callback/my-cb/component.svelte'), 'utf-8'),
        ).toBe('custom');
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement copyWithExclusions**

Create `tools/cli/src/services/FileSystem.ts`:

```ts
import { Effect } from 'effect';
import { FileSystem } from '@effect/platform';
import { isExcluded } from '../config/exclusions.js';
import { FileSystemError } from '../errors.js';
import path from 'node:path';

/** Paths in the target directory that are never overwritten (customer-owned) */
const PROTECTED_DIRS = ['user/'] as const;

function isProtected(relativePath: string): boolean {
  return PROTECTED_DIRS.some((dir) => relativePath.startsWith(dir));
}

/**
 * Recursively copies files from source to target, skipping excluded
 * and protected paths. Protected paths (like /user) in the target
 * are never overwritten.
 */
export const copyWithExclusions = (sourceDir: string, targetDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const walk = (dir: string): Effect.Effect<void, FileSystemError> =>
      Effect.gen(function* () {
        const entries = yield* fs
          .readDirectory(dir)
          .pipe(
            Effect.mapError(
              (cause) => new FileSystemError({ operation: 'readDirectory', path: dir, cause }),
            ),
          );

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const relativePath = path.relative(sourceDir, fullPath);

          if (isExcluded(relativePath) || isProtected(relativePath)) {
            continue;
          }

          const stat = yield* fs
            .stat(fullPath)
            .pipe(
              Effect.mapError(
                (cause) => new FileSystemError({ operation: 'stat', path: fullPath, cause }),
              ),
            );

          const targetPath = path.join(targetDir, relativePath);

          if (stat.type === 'Directory') {
            yield* fs
              .makeDirectory(targetPath, { recursive: true })
              .pipe(
                Effect.mapError(
                  (cause) =>
                    new FileSystemError({ operation: 'makeDirectory', path: targetPath, cause }),
                ),
              );
            yield* walk(fullPath);
          } else {
            yield* fs.makeDirectory(path.dirname(targetPath), { recursive: true }).pipe(
              Effect.mapError(
                (cause) =>
                  new FileSystemError({
                    operation: 'makeDirectory',
                    path: path.dirname(targetPath),
                    cause,
                  }),
              ),
            );
            yield* fs
              .copyFile(fullPath, targetPath)
              .pipe(
                Effect.mapError(
                  (cause) => new FileSystemError({ operation: 'copyFile', path: fullPath, cause }),
                ),
              );
          }
        }
      });

    yield* walk(sourceDir);
  });
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: All copyWithExclusions tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/cli/src/services/FileSystem.ts tools/cli/test/services/FileSystem.test.ts
git commit -m "feat(cli): add FileSystem service with copy and exclusion logic"
```

---

### Task 5: Custom Component Registry Scanner

**Files:**

- Create: `tools/cli/src/services/Registry.ts`
- Create: `tools/cli/test/services/Registry.test.ts`

This is the pre-build task described in the architecture doc. It scans `/user/stage` and `/user/callback`, parses the `<!-- @component -->` metadata comments, and generates `custom-registry.ts`.

- [ ] **Step 1: Write failing tests for registry scanner**

Create `tools/cli/test/services/Registry.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseComponentMetadata,
  scanUserDirectory,
  generateRegistrySource,
} from '../../src/services/Registry.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('parseComponentMetadata', () => {
  it('extracts type and name from component comment', () => {
    const source = `<!--
@component
Type: callback
Name: NameCallback
-->
<script>let { callback } = $props();</script>
<main>Hello</main>`;

    const result = parseComponentMetadata(source);
    expect(result).toEqual({ type: 'callback', name: 'NameCallback' });
  });

  it('extracts stage type', () => {
    const source = `<!--
@component
Type: stage
Name: CustomLogin
-->
<script>let { step } = $props();</script>`;

    const result = parseComponentMetadata(source);
    expect(result).toEqual({ type: 'stage', name: 'CustomLogin' });
  });

  it('returns null for missing metadata', () => {
    const source = `<script>let x = 1;</script><p>No metadata</p>`;
    expect(parseComponentMetadata(source)).toBeNull();
  });
});

describe('scanUserDirectory', () => {
  let userDir: string;

  beforeEach(() => {
    userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-user-'));

    // Create callback component
    fs.mkdirSync(path.join(userDir, 'callback/custom-name'), { recursive: true });
    fs.writeFileSync(
      path.join(userDir, 'callback/custom-name/component.svelte'),
      `<!--\n@component\nType: callback\nName: NameCallback\n-->\n<script>let { callback } = $props();</script>\n<p>Custom</p>`,
    );

    // Create stage component
    fs.mkdirSync(path.join(userDir, 'stage/custom-login'), { recursive: true });
    fs.writeFileSync(
      path.join(userDir, 'stage/custom-login/component.svelte'),
      `<!--\n@component\nType: stage\nName: CustomLogin\n-->\n<script>let { step } = $props();</script>\n<p>Login</p>`,
    );
  });

  afterEach(() => {
    fs.rmSync(userDir, { recursive: true, force: true });
  });

  it('discovers all custom components', () => {
    const components = scanUserDirectory(userDir);
    expect(components).toHaveLength(2);
    expect(components).toContainEqual({
      type: 'callback',
      name: 'NameCallback',
      relativePath: 'callback/custom-name/component.svelte',
    });
    expect(components).toContainEqual({
      type: 'stage',
      name: 'CustomLogin',
      relativePath: 'stage/custom-login/component.svelte',
    });
  });
});

describe('generateRegistrySource', () => {
  it('generates valid TypeScript with imports and exports', () => {
    const components = [
      {
        type: 'callback' as const,
        name: 'NameCallback',
        relativePath: 'callback/custom-name/component.svelte',
      },
      {
        type: 'stage' as const,
        name: 'CustomLogin',
        relativePath: 'stage/custom-login/component.svelte',
      },
    ];

    const source = generateRegistrySource(components);
    expect(source).toContain('import CustomLogin from "$user/stage/custom-login/component.svelte"');
    expect(source).toContain(
      'import NameCallback from "$user/callback/custom-name/component.svelte"',
    );
    expect(source).toContain('export const customStages');
    expect(source).toContain('export const customCallbacks');
    expect(source).toContain('"CustomLogin"');
    expect(source).toContain('"NameCallback"');
  });

  it('generates empty maps when no components', () => {
    const source = generateRegistrySource([]);
    expect(source).toContain('export const customStages = {}');
    expect(source).toContain('export const customCallbacks = {}');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Registry service**

Create `tools/cli/src/services/Registry.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';

export interface ComponentMetadata {
  readonly type: 'callback' | 'stage';
  readonly name: string;
}

export interface DiscoveredComponent extends ComponentMetadata {
  readonly relativePath: string;
}

/**
 * Parses the @component metadata comment from a Svelte file.
 * Expected format:
 *   <!-- @component Type: callback Name: NameCallback -->
 */
export function parseComponentMetadata(source: string): ComponentMetadata | null {
  const match = source.match(/<!--\s*@component\s+Type:\s*(callback|stage)\s+Name:\s*(\w+)\s*-->/s);
  if (!match) return null;
  return { type: match[1] as 'callback' | 'stage', name: match[2] };
}

/**
 * Scans the /user directory for custom components.
 * Looks for component.svelte files in /user/stage/* and /user/callback/*
 */
export function scanUserDirectory(userDir: string): DiscoveredComponent[] {
  const components: DiscoveredComponent[] = [];

  for (const componentType of ['stage', 'callback'] as const) {
    const typeDir = path.join(userDir, componentType);
    if (!fs.existsSync(typeDir)) continue;

    for (const entry of fs.readdirSync(typeDir)) {
      const componentFile = path.join(typeDir, entry, 'component.svelte');
      if (!fs.existsSync(componentFile)) continue;

      const source = fs.readFileSync(componentFile, 'utf-8');
      const metadata = parseComponentMetadata(source);
      if (!metadata) continue;

      components.push({
        ...metadata,
        relativePath: `${componentType}/${entry}/component.svelte`,
      });
    }
  }

  return components;
}

/**
 * Generates the custom-registry.ts source code from discovered components.
 * This file is written to core/journey/_utilities/custom-registry.ts
 */
export function generateRegistrySource(components: DiscoveredComponent[]): string {
  const stages = components.filter((c) => c.type === 'stage');
  const callbacks = components.filter((c) => c.type === 'callback');

  const lines: string[] = [
    '// AUTO-GENERATED by ping-law CLI — do not edit manually',
    '// Re-run `ping-law scan` to regenerate',
    '',
  ];

  // Import statements — use $user alias (configured in Vite + TS configs)
  for (const component of [...stages, ...callbacks]) {
    lines.push(`import ${component.name} from "$user/${component.relativePath}";`);
  }

  if (components.length > 0) lines.push('');

  // Stage map
  if (stages.length === 0) {
    lines.push('export const customStages = {} as Record<string, unknown>;');
  } else {
    lines.push('export const customStages = {');
    for (const stage of stages) {
      lines.push(`  "${stage.name}": ${stage.name},`);
    }
    lines.push('} as Record<string, unknown>;');
  }

  lines.push('');

  // Callback map
  if (callbacks.length === 0) {
    lines.push('export const customCallbacks = {} as Record<string, unknown>;');
  } else {
    lines.push('export const customCallbacks = {');
    for (const cb of callbacks) {
      lines.push(`  "${cb.name}": ${cb.name},`);
    }
    lines.push('} as Record<string, unknown>;');
  }

  lines.push('');
  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: All Registry tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/cli/src/services/Registry.ts tools/cli/test/services/Registry.test.ts
git commit -m "feat(cli): add Registry service for custom component discovery and codegen"
```

---

### Task 6: Demo Custom Components and Templates

**Files:**

- Create: `tools/cli/templates/user/callback/demo-callback/component.svelte`
- Create: `tools/cli/templates/user/callback/demo-callback/utility.ts`
- Create: `tools/cli/templates/user/callback/demo-callback/utility.test.ts`
- Create: `tools/cli/templates/user/stage/demo-stage/component.svelte`
- Create: `tools/cli/templates/user/stage/demo-stage/utility.ts`
- Create: `tools/cli/templates/user/stage/demo-stage/utility.test.ts`
- Create: `tools/cli/templates/ci/ci.yml.ts`
- Create: `tools/cli/templates/env.example.ts`

- [ ] **Step 1: Create demo callback component**

Create `tools/cli/templates/user/callback/demo-callback/component.svelte`:

```svelte
<!--
@component
Type: callback
Name: DemoCallback
-->

<!--
  Demo custom callback component.
  Overrides the rendering for any callback matching the Name above.

  Available props:
    - callback: The SDK callback object (use callback.getType(), callback.getName(), etc.)
    - callbackMetadata: Flags like isFirstInvalidInput, isReadyForSubmission, etc.
    - selfSubmitFunction: Call this to trigger form auto-submission
    - stepMetadata: Step-level flags like isStepSelfSubmittable
    - style: The current theme/style configuration

  Common imports:
    - '$components/*' — Primitives and compositions (Button, Input, Alert, etc.)
    - '$journey/*' — Journey utilities and interfaces
    - '$core/_utilities/i18n.utilities' — interpolate() for localization
    - '@forgerock/javascript-sdk' — SDK types and utilities
-->

<script lang="ts">
  import type { FRCallback } from '@forgerock/javascript-sdk';
  import type { CallbackMetadata, StepMetadata } from '$journey/journey.interfaces';
  import type { Maybe } from '$core/interfaces';
  import { formatCallbackName } from './utility';

  export let callback: FRCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: () => void;
  export let stepMetadata: Maybe<StepMetadata>;
  export let style: Record<string, unknown>;

  $: displayName = formatCallbackName(callback);
</script>

<div class="tw_p-4 tw_border tw_border-dashed tw_border-gray-400 tw_rounded">
  <p class="tw_text-sm tw_text-gray-600">Custom Callback: {displayName}</p>
  <p class="tw_text-xs tw_text-gray-400">Type: {callback.getType()}</p>
</div>
```

- [ ] **Step 2: Create demo callback utility + test**

Create `tools/cli/templates/user/callback/demo-callback/utility.ts`:

```ts
import type { FRCallback } from '@forgerock/javascript-sdk';

export function formatCallbackName(callback: FRCallback): string {
  const type = callback.getType();
  return type.replace(/([A-Z])/g, ' $1').trim();
}
```

Create `tools/cli/templates/user/callback/demo-callback/utility.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { formatCallbackName } from './utility';

describe('formatCallbackName', () => {
  it('converts PascalCase callback type to readable format', () => {
    const mockCallback = { getType: vi.fn(() => 'NameCallback') } as any;
    expect(formatCallbackName(mockCallback)).toBe('Name Callback');
  });

  it('handles single-word types', () => {
    const mockCallback = { getType: vi.fn(() => 'Password') } as any;
    expect(formatCallbackName(mockCallback)).toBe('Password');
  });
});
```

- [ ] **Step 3: Create demo stage component**

Create `tools/cli/templates/user/stage/demo-stage/component.svelte`:

```svelte
<!--
@component
Type: stage
Name: DemoStage
-->

<!--
  Demo custom stage component.
  Overrides the rendering for an entire stage (one or more callbacks).

  Available props:
    - componentStyle: 'app' | 'inline' | 'modal'
    - form: { icon, message, status, submit } — form state and submission
    - formEl: HTMLFormElement reference (bindable)
    - journey: { loading, pop, push, stack } — navigation and loading state
    - metadata: { callbacks: CallbackMetadata[], step: StepMetadata }
    - step: FRStep — the raw AM step with callbacks

  To render individual callbacks within your custom stage,
  use the CallbackMapper component (see generic.svelte for reference).
-->

<script lang="ts">
  import { FRStep } from '@forgerock/javascript-sdk';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import CallbackMapper from '$journey/_utilities/callback-mapper.svelte';
  import { styleStore } from '$core/style.store';
  import { formatStageName } from './utility';

  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Maybe } from '$core/interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  }>;
  export let step: FRStep;

  $: stageName = formatStageName(step);
</script>

<Form bind:formEl onSubmitWhenValid={form.submit}>
  <div class="tw_p-4 tw_border-2 tw_border-dashed tw_border-blue-400 tw_rounded">
    <h2 class="tw_text-lg tw_font-semibold tw_mb-4">Custom Stage: {stageName}</h2>

    {#each step?.callbacks as callback, idx}
      <CallbackMapper
        props={{
          callback,
          callbackMetadata: metadata?.callbacks[idx],
          selfSubmitFunction: () => form.submit(),
          stepMetadata: metadata?.step && { ...metadata.step },
          style: $styleStore,
        }}
      />
    {/each}

    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      Continue
    </Button>
  </div>
</Form>
```

- [ ] **Step 4: Create demo stage utility + test**

Create `tools/cli/templates/user/stage/demo-stage/utility.ts`:

```ts
import type { FRStep } from '@forgerock/javascript-sdk';

export function formatStageName(step: FRStep): string {
  const stage = step?.getStage?.() || 'Unknown';
  return stage.replace(/([A-Z])/g, ' $1').trim();
}
```

Create `tools/cli/templates/user/stage/demo-stage/utility.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { formatStageName } from './utility';

describe('formatStageName', () => {
  it('converts stage name to readable format', () => {
    const mockStep = { getStage: vi.fn(() => 'DefaultLogin') } as any;
    expect(formatStageName(mockStep)).toBe('Default Login');
  });

  it('handles missing stage name', () => {
    const mockStep = { getStage: vi.fn(() => '') } as any;
    expect(formatStageName(mockStep)).toBe('Unknown');
  });
});
```

- [ ] **Step 5: Create basic CI template**

Create `tools/cli/templates/ci/ci.yml.ts`:

```ts
export function generateCiWorkflow(): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm check:lint
        name: Lint

      - run: pnpm test -- --run
        name: Unit Tests

      - run: pnpm build:app
        name: Build

      - run: pnpm --filter @forgerock/login-widget-e2e exec playwright install chromium
        name: Install Playwright

      - run: pnpm ci:e2e
        name: E2E Tests
`;
}
```

- [ ] **Step 6: Create .env.example template**

Create `tools/cli/templates/env.example.ts`:

```ts
export function generateEnvExample(): string {
  return `# ForgeRock AM Connection
VITE_FR_AM_URL=https://your-tenant.forgeblocks.com/am
VITE_FR_AM_COOKIE_NAME=iPlanetDirectoryPro
VITE_FR_OAUTH_PUBLIC_CLIENT=your-oauth-client-id
VITE_FR_REALM_PATH=alpha
`;
}
```

- [ ] **Step 7: Commit**

```bash
git add tools/cli/templates/
git commit -m "feat(cli): add demo custom components, CI workflow, and env templates"
```

---

### Task 7: Implement the `generate` Command

**Files:**

- Create: `tools/cli/src/commands/generate.ts`
- Create: `tools/cli/test/generate.test.ts`

- [ ] **Step 1: Write failing test for generate command helpers**

Create `tools/cli/test/generate.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffoldUserDirectory, scaffoldCi, scaffoldEnvExample } from '../src/commands/generate.js';

describe('scaffoldUserDirectory', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-gen-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('creates user/stage and user/callback directories', () => {
    scaffoldUserDirectory(targetDir);
    expect(fs.existsSync(path.join(targetDir, 'user/stage'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'user/callback'))).toBe(true);
  });

  it('copies demo components', () => {
    scaffoldUserDirectory(targetDir);
    expect(
      fs.existsSync(path.join(targetDir, 'user/callback/demo-callback/component.svelte')),
    ).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'user/stage/demo-stage/component.svelte'))).toBe(
      true,
    );
  });

  it('does not overwrite existing user directory contents', () => {
    fs.mkdirSync(path.join(targetDir, 'user/callback/my-custom'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'user/callback/my-custom/component.svelte'), 'mine');

    scaffoldUserDirectory(targetDir);

    expect(
      fs.readFileSync(path.join(targetDir, 'user/callback/my-custom/component.svelte'), 'utf-8'),
    ).toBe('mine');
  });
});

describe('scaffoldCi', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-gen-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('creates .github/workflows/ci.yml', () => {
    scaffoldCi(targetDir);
    const ciPath = path.join(targetDir, '.github/workflows/ci.yml');
    expect(fs.existsSync(ciPath)).toBe(true);
    expect(fs.readFileSync(ciPath, 'utf-8')).toContain('pnpm install');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement generate command**

Create `tools/cli/src/commands/generate.ts`:

```ts
import { Args, Command, Options } from '@effect/cli';
import { Effect } from 'effect';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyWithExclusions } from '../services/FileSystem.js';
import { Release } from '../services/Release.js';
import { writeVersion, type GeneratorVersion } from '../config/version.js';
import { scanUserDirectory, generateRegistrySource } from '../services/Registry.js';
import { generateCiWorkflow } from '../../templates/ci/ci.yml.js';
import { generateEnvExample } from '../../templates/env.example.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Templates are copied to dist/templates/ by the build script (tsc && cp -r templates dist/templates)
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// --- Exported helpers (testable independently) ---

export function scaffoldUserDirectory(targetDir: string): void {
  const userDir = path.join(targetDir, 'user');

  for (const subDir of ['stage', 'callback']) {
    const dir = path.join(userDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Copy demo components only if they don't already exist
  for (const componentType of ['stage/demo-stage', 'callback/demo-callback']) {
    const targetComponent = path.join(userDir, componentType);
    if (!fs.existsSync(targetComponent)) {
      const sourceComponent = path.join(TEMPLATES_DIR, 'user', componentType);
      fs.cpSync(sourceComponent, targetComponent, { recursive: true });
    }
  }
}

export function scaffoldCi(targetDir: string): void {
  const workflowDir = path.join(targetDir, '.github/workflows');
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.writeFileSync(path.join(workflowDir, 'ci.yml'), generateCiWorkflow());
}

export function scaffoldEnvExample(targetDir: string): void {
  const envPath = path.join(targetDir, '.env.example');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, generateEnvExample());
  }
}

// --- Command definition ---

const directory = Args.directory({ name: 'directory' }).pipe(Args.withDefault('.'));
const version = Options.text('version').pipe(
  Options.withAlias('v'),
  Options.withDescription('Framework version to generate (e.g. v1.0.0)'),
);

export const generate = Command.make('generate', { directory, version }, ({ directory, version }) =>
  Effect.gen(function* () {
    const targetDir = path.resolve(directory);
    yield* Effect.log(`Generating framework v${version} into ${targetDir}`);

    // 1. Fetch and extract framework release
    const release = yield* Release;
    const sourceDir = yield* release.fetch(version, targetDir);

    // 2. Copy framework files (excluding CI, internal config, etc.)
    yield* Effect.log('Copying framework files...');
    yield* copyWithExclusions(sourceDir, targetDir);

    // 3. Scaffold /user directory with demo components
    yield* Effect.log('Scaffolding /user directory...');
    yield* Effect.sync(() => scaffoldUserDirectory(targetDir));

    // 4. Generate basic CI
    yield* Effect.log('Generating CI workflow...');
    yield* Effect.sync(() => scaffoldCi(targetDir));

    // 5. Generate .env.example
    yield* Effect.sync(() => scaffoldEnvExample(targetDir));

    // 6. Generate custom-registry.ts from /user contents
    yield* Effect.log('Scanning custom components...');
    const userDir = path.join(targetDir, 'user');
    const components = scanUserDirectory(userDir);
    const registrySource = generateRegistrySource(components);
    const registryPath = path.join(targetDir, 'core/journey/_utilities/custom-registry.ts');
    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(registryPath, registrySource);
    yield* Effect.log(`Registered ${components.length} custom component(s)`);

    // 7. Write .generator-version
    const generatorVersion: GeneratorVersion = {
      version,
      commitHash: version,
      generatedAt: new Date().toISOString(),
    };
    yield* writeVersion(targetDir, generatorVersion);

    // 8. Clean up temp directory
    fs.rmSync(sourceDir, { recursive: true, force: true });

    yield* Effect.log(`Done! Framework generated at ${targetDir}`);
    yield* Effect.log('Next steps:');
    yield* Effect.log('  1. cd ' + targetDir);
    yield* Effect.log('  2. pnpm install');
    yield* Effect.log('  3. Copy .env.example to .env and fill in your AM details');
    yield* Effect.log('  4. pnpm dev');
  }),
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: All scaffold tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/cli/src/commands/generate.ts tools/cli/test/generate.test.ts
git commit -m "feat(cli): implement generate command with scaffolding"
```

---

### Task 8: Implement the `update` Command

**Files:**

- Create: `tools/cli/src/commands/update.ts`
- Create: `tools/cli/test/update.test.ts`

- [ ] **Step 1: Write failing test for update preserving /user**

Create `tools/cli/test/update.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('update preserves /user directory', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-update-'));

    // Simulate existing generated project
    fs.mkdirSync(path.join(targetDir, 'core/journey'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'core/journey/journey.svelte'), 'old framework');

    fs.mkdirSync(path.join(targetDir, 'user/callback/my-custom'), { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, 'user/callback/my-custom/component.svelte'),
      'my custom component',
    );

    fs.writeFileSync(
      path.join(targetDir, '.generator-version'),
      JSON.stringify({ version: 'v0.9.0', commitHash: 'v0.9.0', generatedAt: '2026-01-01' }),
    );
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('user directory is untouched after framework copy', async () => {
    const { copyWithExclusions } = await import('../src/services/FileSystem.js');
    const { Effect } = await import('effect');
    const { NodeContext } = await import('@effect/platform-node');

    // Create a mock "new framework source"
    const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-new-'));
    fs.mkdirSync(path.join(sourceDir, 'core/journey'), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'core/journey/journey.svelte'), 'new framework');

    await copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );

    // Framework code updated
    expect(fs.readFileSync(path.join(targetDir, 'core/journey/journey.svelte'), 'utf-8')).toBe(
      'new framework',
    );

    // User code preserved
    expect(
      fs.readFileSync(path.join(targetDir, 'user/callback/my-custom/component.svelte'), 'utf-8'),
    ).toBe('my custom component');

    fs.rmSync(sourceDir, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: PASS (relies on copyWithExclusions already protecting `/user`).

- [ ] **Step 3: Implement update command**

Create `tools/cli/src/commands/update.ts`:

```ts
import { Args, Command, Options } from '@effect/cli';
import { Effect } from 'effect';
import fs from 'node:fs';
import path from 'node:path';
import { copyWithExclusions } from '../services/FileSystem.js';
import { Release } from '../services/Release.js';
import { readVersion, writeVersion, type GeneratorVersion } from '../config/version.js';
import { scanUserDirectory, generateRegistrySource } from '../services/Registry.js';

const version = Options.text('version').pipe(
  Options.withAlias('v'),
  Options.withDescription('Framework version to update to (e.g. v1.1.0). Required.'),
);

const directory = Args.directory({ name: 'directory' }).pipe(Args.withDefault('.'));

export const update = Command.make('update', { directory, version }, ({ directory, version }) =>
  Effect.gen(function* () {
    const targetDir = path.resolve(directory);

    // 1. Read current version
    const currentVersion = yield* readVersion(targetDir);
    yield* Effect.log(`Current version: ${currentVersion.version}`);

    // 2. Check if already up to date
    if (version === currentVersion.version) {
      yield* Effect.log('Already up to date.');
      return;
    }
    yield* Effect.log(`Updating to ${version}...`);

    // 3. Fetch new framework release
    const release = yield* Release;
    const sourceDir = yield* release.fetch(version, targetDir);

    // 4. Overwrite framework files (preserves /user)
    yield* Effect.log('Updating framework files...');
    yield* copyWithExclusions(sourceDir, targetDir);

    // 5. Re-scan /user and regenerate custom-registry.ts
    yield* Effect.log('Regenerating custom component registry...');
    const userDir = path.join(targetDir, 'user');
    const components = scanUserDirectory(userDir);
    const registrySource = generateRegistrySource(components);
    const registryPath = path.join(targetDir, 'core/journey/_utilities/custom-registry.ts');
    fs.writeFileSync(registryPath, registrySource);
    yield* Effect.log(`Registered ${components.length} custom component(s)`);

    // 6. Update .generator-version
    const newVersion: GeneratorVersion = {
      version,
      commitHash: version,
      generatedAt: new Date().toISOString(),
    };
    yield* writeVersion(targetDir, newVersion);

    // 7. Clean up
    fs.rmSync(sourceDir, { recursive: true, force: true });

    yield* Effect.log(`Updated from ${currentVersion.version} → ${version}`);
    yield* Effect.log('Run `pnpm install` to update dependencies.');
  }),
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: All update tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/cli/src/commands/update.ts tools/cli/test/update.test.ts
git commit -m "feat(cli): implement update command with version tracking"
```

---

### Task 9: Implement the `scan` Command and Wire All Commands

**Files:**

- Create: `tools/cli/src/commands/scan.ts`
- Modify: `tools/cli/src/main.ts`
- Modify: root `package.json`

- [ ] **Step 1: Implement scan command**

Create `tools/cli/src/commands/scan.ts`:

```ts
import { Args, Command } from '@effect/cli';
import { Effect } from 'effect';
import fs from 'node:fs';
import path from 'node:path';
import { scanUserDirectory, generateRegistrySource } from '../services/Registry.js';

const directory = Args.directory({ name: 'directory' }).pipe(Args.withDefault('.'));

export const scan = Command.make('scan', { directory }, ({ directory }) =>
  Effect.gen(function* () {
    const targetDir = path.resolve(directory);
    const userDir = path.join(targetDir, 'user');

    if (!fs.existsSync(userDir)) {
      yield* Effect.log('No /user directory found. Writing empty registry.');
      const registryPath = path.join(targetDir, 'core/journey/_utilities/custom-registry.ts');
      fs.mkdirSync(path.dirname(registryPath), { recursive: true });
      fs.writeFileSync(registryPath, generateRegistrySource([]));
      return;
    }

    const components = scanUserDirectory(userDir);
    const registrySource = generateRegistrySource(components);
    const registryPath = path.join(targetDir, 'core/journey/_utilities/custom-registry.ts');
    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(registryPath, registrySource);
    yield* Effect.log(`Registry updated: ${components.length} custom component(s)`);
  }),
);
```

- [ ] **Step 2: Update main.ts to wire all commands**

Replace `tools/cli/src/main.ts`:

```ts
import { Command } from '@effect/cli';
import { Effect } from 'effect';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { generate } from './commands/generate.js';
import { update } from './commands/update.js';
import { scan } from './commands/scan.js';
import { ReleaseLive } from './services/Release.js';

const command = Command.make('ping-law').pipe(Command.withSubcommands([generate, update, scan]));

const cli = Command.run(command, {
  name: 'ping-law',
  version: '0.1.0',
});

cli(process.argv).pipe(
  Effect.provide(ReleaseLive),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
);
```

- [ ] **Step 3: Add scripts to root package.json**

In root `package.json`, add the `ping-law` script and chain `scan` into existing build scripts:

```json
"ping-law": "pnpm --filter @forgerock/login-widget-generator build && node tools/cli/dist/main.js",
"build:widget": "pnpm ping-law -- scan && pnpm --filter @forgerock/login-widget build",
"build:app": "pnpm ping-law -- scan && pnpm --filter @forgerock/login-widget build && pnpm --filter @forgerock/login-app build"
```

> **Note:** We chain `ping-law scan` explicitly into the build scripts rather than using `prebuild:*` hooks, because pnpm does not support `pre`/`post` hooks for scripts with colons unless `enable-pre-post-scripts=true` is set in `.npmrc`.

- [ ] **Step 4: Build and verify all commands**

```bash
pnpm ping-law -- --help
pnpm ping-law -- generate --help
pnpm ping-law -- update --help
pnpm ping-law -- scan --help
```

Expected: All four show proper help text.

- [ ] **Step 5: Commit**

```bash
git add tools/cli/src/commands/scan.ts tools/cli/src/main.ts package.json
git commit -m "feat(cli): add scan command and wire all subcommands into ping-law CLI"
```

---

### Task 10: Integrate Custom Registry into Core Framework

**Files:**

- Create: `core/journey/_utilities/custom-registry.ts`
- Modify: `core/journey/_utilities/map-stage.utilities.ts`
- Modify: `core/journey/_utilities/callback-mapper.svelte`
- Modify: `.gitignore`

This task modifies the framework's core files to import and merge the custom component registry. The `custom-registry.ts` file ships with empty maps by default — the pre-build task (`ping-law scan`) populates it. It also adds the `$user` path alias so Vite and TypeScript can resolve imports from custom components.

- [ ] **Step 0: Add `$user` path alias to TypeScript and Vite configs**

Custom components in `/user/` import from `$core/*`, `$journey/*`, `$components/*` — these aliases must resolve when compiling `user/` components. The `user/` directory also needs its own alias so `custom-registry.ts` can use `$user/` imports instead of fragile relative paths.

In `core/tsconfig.json`, add to `compilerOptions.paths`:

```json
"$user/*": ["../user/*"]
```

In `packages/login-widget/vite.config.ts` and `apps/login-app/vite.config.ts`, add to `resolve.alias`:

```ts
'$user': path.resolve(__dirname, '../../user'),
```

Update `generateRegistrySource` in `tools/cli/src/services/Registry.ts` to use the alias:

```ts
// Instead of: import CustomLogin from "../../../../user/stage/custom-login/component.svelte";
// Generate:   import CustomLogin from "$user/stage/custom-login/component.svelte";
const importPath = `$user/${component.relativePath}`;
```

- [ ] **Step 1: Create the default (empty) custom-registry.ts**

Create `core/journey/_utilities/custom-registry.ts`:

```ts
// AUTO-GENERATED by ping-law CLI — do not edit manually
// Re-run `ping-law scan` to regenerate

export const customStages = {} as Record<string, unknown>;

export const customCallbacks = {} as Record<string, unknown>;
```

- [ ] **Step 2: Modify map-stage.utilities.ts to check custom stages first**

In `core/journey/_utilities/map-stage.utilities.ts`:

Add import at top:

```ts
import { customStages } from './custom-registry';
```

At the beginning of `mapStepToStage`, before the existing switch, add:

```ts
// Check custom stage registry first (customer overrides take priority)
const stageName = currentStep?.getStage?.() || '';
if (stageName && stageName in customStages) {
  return customStages[stageName] as StageTypes;
}
```

- [ ] **Step 3: Modify callback-mapper.svelte to check custom callbacks first**

In `core/journey/_utilities/callback-mapper.svelte`:

Add import in the `<script>` block:

```ts
import { customCallbacks } from './custom-registry';
```

Add a reactive variable after the existing `cbType` declaration:

```ts
let CustomComponent: unknown = null;
```

In the existing `$:` reactive block, before the switch statement, add:

```ts
CustomComponent = cbType in customCallbacks ? customCallbacks[cbType] : null;
```

Wrap the switch in an `if (!CustomComponent)` guard so it only runs for non-custom callbacks.

At the top of the template, before the first `{#if}`, add:

```svelte
{#if CustomComponent}
  <svelte:component this={CustomComponent} {...props} />
{:else if cbType === CallbackType.BooleanAttributeInputCallback}
```

And close the block at the bottom by changing the final `{/if}` appropriately.

- [ ] **Step 4: Add custom-registry.ts note to .gitignore**

Add to `.gitignore`:

```gitignore
# Custom component registry (auto-generated by ping-law scan)
# Uncomment the next line in generated customer repos:
# core/journey/_utilities/custom-registry.ts
```

- [ ] **Step 5: Verify build still works with empty registry**

```bash
pnpm build:widget
```

Expected: Build succeeds — empty registry maps have no effect.

- [ ] **Step 6: Run existing tests to ensure no regressions**

```bash
pnpm --filter @forgerock/login-widget exec vitest run
```

Expected: All existing tests PASS.

- [ ] **Step 7: Add unit test for custom stage registry integration**

Create `core/journey/_utilities/map-stage.utilities.test.ts` (or add to existing test file):

```ts
import { describe, it, expect, vi } from 'vitest';
import { mapStepToStage } from './map-stage.utilities';

// Mock the custom registry to test integration
vi.mock('./custom-registry', () => ({
  customStages: {
    CustomLogin: { /* mock Svelte component */ __isMock: true },
  },
}));

describe('mapStepToStage with custom registry', () => {
  it('returns custom stage when stage name matches registry', () => {
    const mockStep = {
      type: 'Step',
      getStage: () => 'CustomLogin',
      callbacks: [],
      getCallbacksOfType: () => [],
    } as any;

    const result = mapStepToStage(mockStep);
    expect((result as any).__isMock).toBe(true);
  });

  it('falls back to built-in stages when no custom match', () => {
    const mockStep = {
      type: 'Step',
      getStage: () => 'DefaultLogin',
      callbacks: [],
      getCallbacksOfType: () => [],
    } as any;

    const result = mapStepToStage(mockStep);
    // Should return the built-in Login component, not undefined
    expect(result).toBeDefined();
    expect((result as any).__isMock).toBeUndefined();
  });
});
```

- [ ] **Step 8: Run all tests again**

```bash
pnpm --filter @forgerock/login-widget exec vitest run
```

Expected: All tests PASS including the new custom registry tests.

- [ ] **Step 9: Commit**

```bash
git add core/journey/_utilities/custom-registry.ts core/journey/_utilities/map-stage.utilities.ts core/journey/_utilities/map-stage.utilities.test.ts core/journey/_utilities/callback-mapper.svelte .gitignore core/tsconfig.json packages/login-widget/vite.config.ts apps/login-app/vite.config.ts
git commit -m "feat: integrate custom component registry into stage and callback mappers"
```

---

### Task 11: End-to-End Smoke Test

**Files:**

- Create: `tools/cli/test/e2e/smoke.test.ts`

- [ ] **Step 1: Write smoke tests**

Create `tools/cli/test/e2e/smoke.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  scaffoldUserDirectory,
  scaffoldCi,
  scaffoldEnvExample,
} from '../../src/commands/generate.js';
import { scanUserDirectory, generateRegistrySource } from '../../src/services/Registry.js';

describe('ping-law generate (smoke)', () => {
  let targetDir: string;

  afterEach(() => {
    if (targetDir) fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('scaffolds user directory and templates', () => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-smoke-'));

    scaffoldUserDirectory(targetDir);
    scaffoldCi(targetDir);
    scaffoldEnvExample(targetDir);

    expect(fs.existsSync(path.join(targetDir, 'user/stage/demo-stage/component.svelte'))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(targetDir, 'user/callback/demo-callback/component.svelte')),
    ).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github/workflows/ci.yml'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.env.example'))).toBe(true);

    const demoCallback = fs.readFileSync(
      path.join(targetDir, 'user/callback/demo-callback/component.svelte'),
      'utf-8',
    );
    expect(demoCallback).toContain('@component');
    expect(demoCallback).toContain('Type: callback');
    expect(demoCallback).toContain('Name: DemoCallback');
  });

  it('scan generates valid registry from demo components', () => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-smoke-'));

    scaffoldUserDirectory(targetDir);

    const components = scanUserDirectory(path.join(targetDir, 'user'));
    expect(components).toHaveLength(2);

    const source = generateRegistrySource(components);
    expect(source).toContain('DemoCallback');
    expect(source).toContain('DemoStage');
    expect(source).toContain('customStages');
    expect(source).toContain('customCallbacks');
  });
});
```

- [ ] **Step 2: Run smoke tests**

```bash
cd tools/cli && pnpm test -- --run
```

Expected: All smoke tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tools/cli/test/e2e/
git commit -m "test(cli): add E2E smoke tests for generate and scan flows"
```

---

## Summary of Integration Points

| Framework File                                   | Change                                | Purpose                                          |
| ------------------------------------------------ | ------------------------------------- | ------------------------------------------------ |
| `pnpm-workspace.yaml`                            | Add `tools/*`                         | Include CLI in monorepo                          |
| `package.json` (root)                            | Add `ping-law` + `prebuild:*` scripts | CLI entry point + pre-build hook                 |
| `core/journey/_utilities/custom-registry.ts`     | New (generated)                       | Maps custom component names to Svelte components |
| `core/journey/_utilities/map-stage.utilities.ts` | Import + check registry               | Custom stages override built-in stages           |
| `core/journey/_utilities/callback-mapper.svelte` | Import + check registry               | Custom callbacks override built-in callbacks     |
| `.gitignore`                                     | Add `custom-registry.ts` note         | Document generated file                          |
