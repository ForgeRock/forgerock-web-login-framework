import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildRegistryContent,
  parseAcceptedProps,
  parseComponentHeader,
  runRegistryScript,
  toPascalCase,
} from './registry.js';

import type { RegistryCollisionError } from './registry.js';

const decode = (filePath: string, content: string) =>
  Effect.runSync(parseComponentHeader(filePath, content));

const decodeError = (filePath: string, content: string) =>
  Effect.runSync(Effect.flip(parseComponentHeader(filePath, content)));

const nodePath = Effect.runSync(
  Effect.provide(
    Effect.gen(function* () {
      return yield* Path.Path;
    }),
    NodeContext.layer,
  ),
);

// buildRegistryContent returns an Effect (never throws): success unwraps the
// generated content, failure unwraps the typed error — mirroring decode/decodeError.
const buildContent = (...args: Parameters<typeof buildRegistryContent>): string =>
  Effect.runSync(buildRegistryContent(...args));

const buildError = (...args: Parameters<typeof buildRegistryContent>): RegistryCollisionError =>
  Effect.runSync(Effect.flip(buildRegistryContent(...args)));

describe('parseComponentHeader', () => {
  describe('valid headers', () => {
    it('parses a stage component header', () => {
      const content = `<!--\n   @component\n   Type: stage\n   Name: DefaultLogin\n   -->\n<script>...`;
      expect(decode('test.svelte', content)).toEqual({ type: 'stage', name: 'DefaultLogin' });
    });

    it('parses a stage name with spaces', () => {
      const content = `<!--\n@component\nType: stage\nName: Custom Login Stage\n-->\n<script>...`;
      expect(decode('test.svelte', content)).toEqual({ type: 'stage', name: 'Custom Login Stage' });
    });

    it('trims trailing whitespace from stage name', () => {
      const content = `<!--\n@component\nType: stage\nName: My Stage   \n-->\n<script>...`;
      expect(decode('test.svelte', content).name).toBe('My Stage');
    });

    it('parses a callback component header', () => {
      const content = `<!--\n   @component\n   Type: callback\n   Name: MyCallback\n   -->\n<script>...`;
      expect(decode('test.svelte', content)).toEqual({ type: 'callback', name: 'MyCallback' });
    });

    it('normalizes Type to lowercase', () => {
      const content = `<!--\n   @component\n   Type: Stage\n   Name: Foo\n   -->\n`;
      expect(decode('test.svelte', content).type).toBe('stage');
    });
  });

  describe('invalid headers', () => {
    it('fails when there is no opening comment', () => {
      const err = decodeError('test.svelte', '<script>no header</script>');
      expect(String(err.cause)).toContain('Missing @component header');
    });

    it('fails when @component tag is absent', () => {
      const err = decodeError('test.svelte', `<!-- no tag -->`);
      expect(String(err.cause)).toContain('Missing "@component" tag');
    });

    it('fails when Type field is missing', () => {
      const err = decodeError('test.svelte', `<!-- @component\n   Name: Foo -->`);
      expect(String(err.cause)).toContain('Missing "Type:" field');
    });

    it('fails when Type value is not stage or callback', () => {
      const err = decodeError('test.svelte', `<!-- @component\n   Type: widget\n   Name: Foo -->`);
      expect(String(err.cause)).toContain('Invalid Type value');
    });

    it('fails when Type value is an unknown custom component type', () => {
      const err = decodeError(
        'test.svelte',
        `<!-- @component\n   Type: container\n   Name: Foo -->`,
      );
      expect(String(err.cause)).toContain('Invalid Type value');
    });

    it('fails when Type value is header (removed type)', () => {
      const err = decodeError('test.svelte', `<!-- @component\n   Type: header\n   Name: Foo -->`);
      expect(String(err.cause)).toContain('Invalid Type value');
    });

    it('fails when Type value is footer (removed type)', () => {
      const err = decodeError('test.svelte', `<!-- @component\n   Type: footer\n   Name: Foo -->`);
      expect(String(err.cause)).toContain('Invalid Type value');
    });

    it('fails when Name field is missing', () => {
      const err = decodeError('test.svelte', `<!-- @component\n   Type: stage -->`);
      expect(String(err.cause)).toContain('Missing "Name:" field');
    });

    it('fails when Name is "__proto__" (would corrupt the generated Record literal)', () => {
      const err = decodeError(
        'test.svelte',
        `<!-- @component\n   Type: stage\n   Name: __proto__ -->`,
      );
      expect(String(err.cause)).toContain('Reserved key "__proto__"');
    });

    it('fails when Name is "constructor" (reserved object-literal key)', () => {
      const err = decodeError(
        'test.svelte',
        `<!-- @component\n   Type: callback\n   Name: constructor -->`,
      );
      expect(String(err.cause)).toContain('Reserved key "constructor"');
    });
  });
});

describe('parseAcceptedProps', () => {
  it('extracts export let declarations from a script block', () => {
    const content = `<script>\nexport let foo;\nexport let bar;\nlet baz;\n</script>`;
    expect(parseAcceptedProps(content)).toEqual(['foo', 'bar']);
  });

  it('returns empty array when there is no script block', () => {
    expect(parseAcceptedProps('<div>no script</div>')).toEqual([]);
  });

  it('returns empty array when there are no export let declarations', () => {
    const content = `<script>\nconst x = 1;\nlet internal;\n</script>`;
    expect(parseAcceptedProps(content)).toEqual([]);
  });

  it('handles multiple props with various types', () => {
    const content = `<script lang="ts">\nexport let name: string;\nexport let count = 0;\n</script>`;
    expect(parseAcceptedProps(content)).toEqual(['name', 'count']);
  });

  it('ignores export const declarations', () => {
    const content = `<script>\nexport let callback;\nexport const style = {};\nexport const stepMetadata = null;\n</script>`;
    expect(parseAcceptedProps(content)).toEqual(['callback']);
  });

  it('skips destructured export let declarations instead of pushing undefined', () => {
    const content = `<script>\nexport let { a, b } = props;\nexport let plain;\n</script>`;
    expect(parseAcceptedProps(content)).toEqual(['plain']);
  });

  it('skips array-pattern export let declarations', () => {
    const content = `<script>\nexport let [first, second] = pair;\n</script>`;
    expect(parseAcceptedProps(content)).toEqual([]);
  });
});

describe('toPascalCase', () => {
  it('converts kebab-case', () => {
    expect(toPascalCase('my-login-stage')).toBe('MyLoginStage');
  });

  it('converts space-separated', () => {
    expect(toPascalCase('My Login Stage')).toBe('MyLoginStage');
  });

  it('preserves PascalCase', () => {
    expect(toPascalCase('DefaultLogin')).toBe('DefaultLogin');
  });
});

describe('buildRegistryContent', () => {
  const registryDir = '/repo/core/journey/_utilities/registry';

  it('produces empty registries when no components are scanned', () => {
    const output = buildContent(nodePath, registryDir, [], []);
    expect(output).toContain(
      'export const customStageRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      'export const customCallbackRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).not.toContain('// Stage overrides');
    expect(output).not.toContain('// Callback overrides');
  });

  it('does not emit header or footer registries (removed types)', () => {
    const output = buildContent(nodePath, registryDir, [], []);
    expect(output).not.toContain('customHeaderRegistry');
    expect(output).not.toContain('customFooterRegistry');
  });

  it('emits import lines and registry entries for stages and callbacks', () => {
    const output = buildContent(
      nodePath,
      registryDir,
      [
        {
          filePath: '/repo/experimental/custom/stages/my-stage/my-stage.svelte',
          name: 'My Stage',
          type: 'stage',
          acceptedProps: ['callback', 'style'],
        },
      ],
      [
        {
          filePath: '/repo/experimental/custom/callbacks/my-cb/my-cb.svelte',
          name: 'MyCb',
          type: 'callback',
          acceptedProps: ['callback'],
        },
      ],
    );

    expect(output).toContain(
      `import StageMyStage from '../../../../experimental/custom/stages/my-stage/my-stage.svelte';`,
    );
    expect(output).toContain(
      `import CallbackMyCb from '../../../../experimental/custom/callbacks/my-cb/my-cb.svelte';`,
    );
    expect(output).toContain(
      `"My Stage": { get component() { return StageMyStage; }, acceptedProps: ["callback","style"] },`,
    );
    expect(output).toContain(
      `"MyCb": { get component() { return CallbackMyCb; }, acceptedProps: ["callback"] },`,
    );
  });

  it('uses PascalCase identifiers derived from arbitrary names', () => {
    const output = buildContent(
      nodePath,
      registryDir,
      [
        {
          filePath: '/repo/experimental/custom/stages/foo/foo.svelte',
          name: 'My Login Stage',
          type: 'stage',
          acceptedProps: [],
        },
      ],
      [],
    );
    expect(output).toContain('StageMyLoginStage');
  });

  it('does not emit default pointer exports', () => {
    const output = buildContent(nodePath, registryDir, [], []);
    expect(output).not.toContain('customHeaderDefault');
    expect(output).not.toContain('customFooterDefault');
  });

  it('fails when two components share a registry key (exact duplicate name)', () => {
    const error = buildError(
      nodePath,
      registryDir,
      [
        {
          filePath: '/repo/experimental/custom/stages/a/login.svelte',
          name: 'Login',
          type: 'stage',
          acceptedProps: [],
        },
        {
          filePath: '/repo/experimental/custom/stages/b/login.svelte',
          name: 'Login',
          type: 'stage',
          acceptedProps: [],
        },
      ],
      [],
    );
    expect(error.message).toMatch(/Duplicate component name "StageLogin" in type "stage"/);
    expect(error.message).toMatch(/a\/login\.svelte/);
    expect(error.message).toMatch(/b\/login\.svelte/);
  });

  it('fails when distinct names collide in the generated identifier ("My Login" vs "MyLogin")', () => {
    const error = buildError(
      nodePath,
      registryDir,
      [
        {
          filePath: '/repo/experimental/custom/stages/my-login/login.svelte',
          name: 'My Login',
          type: 'stage',
          acceptedProps: [],
        },
        {
          filePath: '/repo/experimental/custom/stages/mylogin/login.svelte',
          name: 'MyLogin',
          type: 'stage',
          acceptedProps: [],
        },
      ],
      [],
    );
    expect(error.message).toMatch(/Duplicate component name "StageMyLogin" in type "stage"/);
    expect(error.message).toMatch(/my-login\/login\.svelte/);
    expect(error.message).toMatch(/mylogin\/login\.svelte/);
  });

  it('does not fail when a stage and a callback produce the same identifier across registries', () => {
    // Stage prefix + "Foo" → StageFoo; callback prefix + "StageFoo" → CallbackStageFoo.
    // Distinct identifiers, so this is NOT a collision — verify both registries emit.
    const output = buildContent(
      nodePath,
      registryDir,
      [
        {
          filePath: '/repo/experimental/custom/stages/foo/foo.svelte',
          name: 'Foo',
          type: 'stage',
          acceptedProps: [],
        },
      ],
      [
        {
          filePath: '/repo/experimental/custom/callbacks/foo/foo.svelte',
          name: 'StageFoo',
          type: 'callback',
          acceptedProps: [],
        },
      ],
    );
    expect(output).toContain('StageFoo');
    expect(output).toContain('CallbackStageFoo');
  });
});

describe('runRegistryScript', () => {
  let tmpDir: string;

  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    tmpDir = await mkdtemp(join(tmpdir(), 'core-registry-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const writeComponent = async (
    kind: 'stages' | 'callbacks',
    dirName: string,
    fileName: string,
    name: string,
    type: string,
    enabled: boolean = true,
  ) => {
    const dir = join(tmpDir, 'experimental', 'custom', kind, dirName);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, fileName),
      `<!--\n   @component\n   Type: ${type}\n   Name: ${name}\n${
        enabled ? '   Enabled: true\n' : ''
      }   -->\n<div></div>`,
      'utf8',
    );
  };

  const readRegistry = async () =>
    readFile(
      join(tmpDir, 'core', 'journey', '_utilities', 'registry', 'custom-registry.ts'),
      'utf8',
    );

  const run = () =>
    runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer), Effect.runPromise);

  it('scans stages and callbacks and emits both registries', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await writeComponent('callbacks', 'name', 'name.svelte', 'Name', 'callback');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customStageRegistry');
    expect(output).toContain('customCallbackRegistry');
    expect(output).toContain('StageLogin');
    expect(output).toContain('CallbackName');
  });

  it('ignores header and footer directories even when populated (removed types)', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    const headerDir = join(tmpDir, 'experimental', 'custom', 'headers', 'brand');
    await mkdir(headerDir, { recursive: true });
    await writeFile(
      join(headerDir, 'brand.svelte'),
      '<!--\n   @component\n   Type: header\n   Name: Brand\n   Enabled: true\n   -->\n<div></div>',
      'utf8',
    );
    const footerDir = join(tmpDir, 'experimental', 'custom', 'footers', 'legal');
    await mkdir(footerDir, { recursive: true });
    await writeFile(
      join(footerDir, 'legal.svelte'),
      '<!--\n   @component\n   Type: footer\n   Name: Legal\n   Enabled: true\n   -->\n<div></div>',
      'utf8',
    );
    await run();

    const output = await readRegistry();
    expect(output).toContain('StageLogin');
    expect(output).not.toContain('customHeaderRegistry');
    expect(output).not.toContain('customFooterRegistry');
    expect(output).not.toContain('CustomHeaderBrand');
    expect(output).not.toContain('CustomFooterLegal');
  });

  it('keeps the multi-entry Record behavior for stages and callbacks', async () => {
    await writeComponent('stages', 'a', 'one.svelte', 'One', 'stage');
    await writeComponent('stages', 'b', 'two.svelte', 'Two', 'stage');
    await run();

    const output = await readRegistry();
    expect(output).toContain('"One": {');
    expect(output).toContain('"Two": {');
  });

  it('bundles a stage file with a stray Enabled: line (tolerance, never enforced on stages)', async () => {
    const strayDir = join(tmpDir, 'experimental', 'custom', 'stages', 'stray');
    await mkdir(strayDir, { recursive: true });
    await writeFile(
      join(strayDir, 'stray.svelte'),
      `<!--\n   @component\n   Type: stage\n   Name: Stray\n   Enabled: true\n   -->\n<div></div>`,
      'utf8',
    );
    await run();

    const output = await readRegistry();
    // The stray line is silently ignored: the stage bundles regardless.
    expect(output).toContain('StageStray');
  });
});

describe('customRegistry vite plugin', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'core-registry-plugin-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const makeServer = () => {
    const listeners: ((event: string, filePath: string) => void)[] = [];
    return {
      server: {
        watcher: {
          on: vi.fn((_event: string, listener: (event: string, filePath: string) => void) => {
            listeners.push(listener);
          }),
        },
        config: { logger: { error: vi.fn() } },
      },
      listeners,
    };
  };

  const registryPath = () =>
    join(tmpDir, 'core', 'journey', '_utilities', 'registry', 'custom-registry.ts');

  it('a stage add event regenerates the registry', async () => {
    const { customRegistry } = await import('./vite-plugin.js');
    const plugin = customRegistry({ projectRoot: tmpDir });
    const { server, listeners } = makeServer();
    (plugin as { configureServer: (server: unknown) => void }).configureServer(server);
    expect(server.watcher.on).toHaveBeenCalledWith('all', expect.any(Function));

    // Add a stage component and fire the add event through the watcher listener.
    const stageDir = join(tmpDir, 'experimental', 'custom', 'stages', 'brand');
    await mkdir(stageDir, { recursive: true });
    await writeFile(
      join(stageDir, 'brand.svelte'),
      '<!--\n   @component\n   Type: stage\n   Name: Brand\n   -->\n<div></div>',
      'utf8',
    );
    expect(listeners.length).toBeGreaterThan(0);
    for (const listener of listeners) {
      listener('add', join(stageDir, 'brand.svelte'));
    }

    await vi.waitFor(async () => {
      const output = await readFile(registryPath(), 'utf8');
      expect(output).toContain('customStageRegistry: Record<string, CustomRegistryEntry> = {');
      expect(output).toContain('StageBrand');
    });
  });

  it('ignores changes outside the watched directories', async () => {
    const { customRegistry } = await import('./vite-plugin.js');
    const plugin = customRegistry({ projectRoot: tmpDir });

    // Seed a baseline registry file, then record its content.
    await runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer), Effect.runPromise);
    const baseline = await readFile(registryPath(), 'utf8');

    const { server, listeners } = makeServer();
    (plugin as { configureServer: (server: unknown) => void }).configureServer(server);

    // Add a stage file OUTSIDE the watched dirs and fire the event.
    const outsideDir = join(tmpDir, 'experimental', 'elsewhere');
    await mkdir(outsideDir, { recursive: true });
    await writeFile(
      join(outsideDir, 'stray.svelte'),
      '<!--\n   @component\n   Type: stage\n   Name: Stray\n   -->\n<div></div>',
      'utf8',
    );
    for (const listener of listeners) {
      listener('add', join(outsideDir, 'stray.svelte'));
    }
    await new Promise((resolve) => setTimeout(resolve, 100));

    const after = await readFile(registryPath(), 'utf8');
    expect(after).toBe(baseline);
    expect(after).not.toContain('StageStray');
  });

  it('logs a stale-registry action sentence when a watcher regeneration collides on a name', async () => {
    const { customRegistry } = await import('./vite-plugin.js');
    const plugin = customRegistry({ projectRoot: tmpDir });

    // Seed a valid registry with one stage.
    const stageDir = join(tmpDir, 'experimental', 'custom', 'stages', 'brand');
    await mkdir(stageDir, { recursive: true });
    await writeFile(
      join(stageDir, 'brand.svelte'),
      '<!--\n   @component\n   Type: stage\n   Name: Brand\n   -->\n<div></div>',
      'utf8',
    );
    await runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer), Effect.runPromise);
    const baseline = await readFile(registryPath(), 'utf8');

    // Introduce a second stage with the SAME Name: — the regeneration collides.
    const collidingDir = join(tmpDir, 'experimental', 'custom', 'stages', 'other');
    await mkdir(collidingDir, { recursive: true });
    await writeFile(
      join(collidingDir, 'other.svelte'),
      '<!--\n   @component\n   Type: stage\n   Name: Brand\n   -->\n<div></div>',
      'utf8',
    );

    const { server, listeners } = makeServer();
    (plugin as { configureServer: (server: unknown) => void }).configureServer(server);
    for (const listener of listeners) {
      listener('add', join(collidingDir, 'other.svelte'));
    }

    await vi.waitFor(() => {
      expect(server.config.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('custom-registry.ts is stale'),
      );
      expect(server.config.logger.error).toHaveBeenCalledWith(expect.stringContaining('Brand'));
    });

    // The stale file is left on disk (a collision is a fix-on-disk situation, not an
    // auto-deletion): the previously generated content still reads the old set.
    const after = await readFile(registryPath(), 'utf8');
    expect(after).toBe(baseline);
  });
});
