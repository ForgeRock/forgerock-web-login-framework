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
  RegistryCollisionError,
  runRegistryScript,
  toPascalCase,
} from './registry.js';

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

    it('parses a header component header', () => {
      const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   -->\n<div>branding</div>`;
      expect(decode('test.svelte', content)).toEqual({ type: 'header', name: 'MyHeader' });
    });

    it('parses a footer component header', () => {
      const content = `<!--\n   @component\n   Type: footer\n   Name: MyFooter\n   -->\n<div>legal</div>`;
      expect(decode('test.svelte', content)).toEqual({ type: 'footer', name: 'MyFooter' });
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

    it('fails when Name field is missing', () => {
      const err = decodeError('test.svelte', `<!-- @component\n   Type: stage -->`);
      expect(String(err.cause)).toContain('Missing "Name:" field');
    });
  });

  describe('Default: field', () => {
    it('parses a named default on a header component', () => {
      const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Default: OtherHeader\n   -->`;
      expect(decode('test.svelte', content)).toEqual({
        type: 'header',
        name: 'MyHeader',
        default: 'OtherHeader',
      });
    });

    it('parses a named default on a footer component', () => {
      const content = `<!--\n   @component\n   Type: footer\n   Name: MyFooter\n   Default: Legal Footer\n   -->`;
      expect(decode('test.svelte', content)).toEqual({
        type: 'footer',
        name: 'MyFooter',
        default: 'Legal Footer',
      });
    });

    it('omits the default field when absent', () => {
      const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   -->`;
      expect(decode('test.svelte', content).default).toBeUndefined();
    });

    it('parses a Default value containing spaces', () => {
      const content = `<!--\n@component\nType: header\nName: A\nDefault: Brand Header\n-->`;
      expect(decode('test.svelte', content).default).toBe('Brand Header');
    });

    it('hard-errors when a stage declares Default:', () => {
      const err = decodeError(
        'test.svelte',
        `<!--\n@component\nType: stage\nName: Foo\nDefault: Bar\n-->`,
      );
      expect(String(err.cause)).toContain('"Default:"');
      expect(String(err.cause)).toContain('stage');
    });

    it('hard-errors when a callback declares Default:', () => {
      const err = decodeError(
        'test.svelte',
        `<!--\n@component\nType: callback\nName: Foo\nDefault: Bar\n-->`,
      );
      expect(String(err.cause)).toContain('"Default:"');
      expect(String(err.cause)).toContain('callback');
    });

    it('rejects a boolean Default: value on a header', () => {
      const err = decodeError(
        'test.svelte',
        `<!--\n@component\nType: header\nName: Foo\nDefault: true\n-->`,
      );
      expect(String(err.cause)).toContain('named default');
    });

    it('rejects a boolean Default: value on a footer', () => {
      const err = decodeError(
        'test.svelte',
        `<!--\n@component\nType: footer\nName: Foo\nDefault: false\n-->`,
      );
      expect(String(err.cause)).toContain('named default');
    });

    it('rejects an empty Default: value', () => {
      const err = decodeError(
        'test.svelte',
        `<!--\n@component\nType: header\nName: Foo\nDefault:\n-->`,
      );
      expect(String(err.cause)).toContain('named default');
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
    const output = buildRegistryContent(nodePath, registryDir, [], []);
    expect(output).toContain(
      'export const customStageRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      'export const customCallbackRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).not.toContain('// Stage overrides');
    expect(output).not.toContain('// Callback overrides');
  });

  it('emits import lines and registry entries for stages and callbacks', () => {
    const output = buildRegistryContent(
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
    const output = buildRegistryContent(
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

  it('emits a full Record and a default pointer for a header with Default:', () => {
    const output = buildRegistryContent(
      nodePath,
      registryDir,
      [],
      [],
      [
        {
          filePath: '/repo/experimental/custom/headers/brand/brand.svelte',
          name: 'Brand',
          type: 'header',
          acceptedProps: [],
          default: 'Brand',
        },
      ],
      [],
    );
    expect(output).toContain(
      `import CustomHeaderBrand from '../../../../experimental/custom/headers/brand/brand.svelte';`,
    );
    expect(output).toContain(
      'export const customHeaderRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      `"Brand": { get component() { return CustomHeaderBrand; }, acceptedProps: [] },`,
    );
    expect(output).toContain('export const customHeaderDefault: string | null = "Brand";');
    expect(output).toContain('export const customFooterDefault: string | null = null;');
  });

  it('hard-errors when a header has no Default: (entries present)', () => {
    const noDefault = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/brand/brand.svelte',
            name: 'Brand',
            type: 'header',
            acceptedProps: [],
          },
        ],
        [],
      );
    expect(noDefault).toThrow(RegistryCollisionError);
    expect(noDefault).toThrow(/exactly one/);
  });

  it('emits a default pointer pointing at another component of the same type', () => {
    const output = buildRegistryContent(
      nodePath,
      registryDir,
      [],
      [],
      [
        {
          filePath: '/repo/experimental/custom/headers/brand/brand.svelte',
          name: 'Brand',
          type: 'header',
          acceptedProps: [],
        },
        {
          filePath: '/repo/experimental/custom/headers/alt/alt.svelte',
          name: 'Alternate',
          type: 'header',
          acceptedProps: [],
          default: 'Brand',
        },
      ],
      [],
    );
    expect(output).toContain('CustomHeaderBrand');
    expect(output).toContain('CustomHeaderAlt');
    expect(output).toContain('"Brand": {');
    expect(output).toContain('"Alternate": {');
    expect(output).toContain('export const customHeaderDefault: string | null = "Brand";');
  });

  it('emits a full Record and a default pointer for a footer with Default:', () => {
    const output = buildRegistryContent(
      nodePath,
      registryDir,
      [],
      [],
      [],
      [
        {
          filePath: '/repo/experimental/custom/footers/legal/legal.svelte',
          name: 'Legal',
          type: 'footer',
          acceptedProps: [],
          default: 'Legal',
        },
      ],
    );
    expect(output).toContain(
      `import CustomFooterLegal from '../../../../experimental/custom/footers/legal/legal.svelte';`,
    );
    expect(output).toContain(
      'export const customFooterRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain('export const customFooterDefault: string | null = "Legal";');
    expect(output).toContain('export const customHeaderDefault: string | null = null;');
  });

  it('emits null default pointers when no header/footer components exist', () => {
    const output = buildRegistryContent(nodePath, registryDir, [], [], [], []);
    expect(output).toContain(
      'export const customHeaderRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain('export const customHeaderDefault: string | null = null;');
    expect(output).toContain(
      'export const customFooterRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain('export const customFooterDefault: string | null = null;');
  });

  it('emits empty Record braces for an empty header registry', () => {
    const output = buildRegistryContent(nodePath, registryDir, [], [], [], []);
    const headerBlock = output.slice(
      output.indexOf('customHeaderRegistry'),
      output.indexOf('customHeaderDefault'),
    );
    expect(headerBlock).toContain('};');
  });

  it('allows multiple header components with distinct names (multi-entry design)', () => {
    const twoHeaders = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/a/one.svelte',
            name: 'One',
            type: 'header',
            acceptedProps: [],
          },
          {
            filePath: '/repo/experimental/custom/headers/b/two.svelte',
            name: 'Two',
            type: 'header',
            acceptedProps: [],
            default: 'Two',
          },
        ],
        [],
      );
    expect(twoHeaders).not.toThrow();
    const output = twoHeaders();
    expect(output).toContain('"One": {');
    expect(output).toContain('"Two": {');
    expect(output).toContain('CustomHeaderOne');
    expect(output).toContain('CustomHeaderTwo');
  });

  it('hard-errors when zero header components declare Default:', () => {
    const noDefault = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/a/one.svelte',
            name: 'One',
            type: 'header',
            acceptedProps: [],
          },
          {
            filePath: '/repo/experimental/custom/headers/b/two.svelte',
            name: 'Two',
            type: 'header',
            acceptedProps: [],
          },
        ],
        [],
      );
    expect(noDefault).toThrow(RegistryCollisionError);
    expect(noDefault).toThrow(/exactly one/);
    expect(noDefault).toThrow(/a\/one\.svelte/);
    expect(noDefault).toThrow(/b\/two\.svelte/);
  });

  it('hard-errors when two header components declare Default:', () => {
    const twoDefaults = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/a/one.svelte',
            name: 'One',
            type: 'header',
            acceptedProps: [],
            default: 'One',
          },
          {
            filePath: '/repo/experimental/custom/headers/b/two.svelte',
            name: 'Two',
            type: 'header',
            acceptedProps: [],
            default: 'Two',
          },
        ],
        [],
      );
    expect(twoDefaults).toThrow(RegistryCollisionError);
    expect(twoDefaults).toThrow(/exactly one/);
    expect(twoDefaults).toThrow(/Default: One/);
    expect(twoDefaults).toThrow(/Default: Two/);
  });

  it('hard-errors when zero footer components declare Default: (with entries present)', () => {
    const noDefault = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/footers/a/one.svelte',
            name: 'One',
            type: 'footer',
            acceptedProps: [],
          },
        ],
      );
    expect(noDefault).toThrow(RegistryCollisionError);
    expect(noDefault).toThrow(/footer/);
  });

  it('hard-errors when a Default: names a nonexistent component', () => {
    const missingTarget = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/a/one.svelte',
            name: 'One',
            type: 'header',
            acceptedProps: [],
            default: 'Ghost',
          },
        ],
        [],
      );
    expect(missingTarget).toThrow(RegistryCollisionError);
    expect(missingTarget).toThrow(/Default: Ghost/);
    expect(missingTarget).toThrow(/no matching/);
  });

  it('hard-errors when a Default: target exists in the wrong type registry', () => {
    const wrongType = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/a/one.svelte',
            name: 'One',
            type: 'header',
            acceptedProps: [],
            default: 'Legal',
          },
        ],
        [
          {
            filePath: '/repo/experimental/custom/footers/b/legal.svelte',
            name: 'Legal',
            type: 'footer',
            acceptedProps: [],
          },
        ],
      );
    expect(wrongType).toThrow(RegistryCollisionError);
    expect(wrongType).toThrow(/Default: Legal/);
  });

  it('throws when two components share a registry key (exact duplicate name)', () => {
    const duplicate = () =>
      buildRegistryContent(
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
    expect(duplicate).toThrow(/Duplicate component name "StageLogin" in type "stage"/);
    expect(duplicate).toThrow(/a\/login\.svelte/);
    expect(duplicate).toThrow(/b\/login\.svelte/);
  });

  it('throws when distinct names collide in the generated identifier ("My Login" vs "MyLogin")', () => {
    const colliding = () =>
      buildRegistryContent(
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
    expect(colliding).toThrow(/Duplicate component name "StageMyLogin" in type "stage"/);
    expect(colliding).toThrow(/my-login\/login\.svelte/);
    expect(colliding).toThrow(/mylogin\/login\.svelte/);
  });

  it('throws when a stage and a callback produce the same identifier across registries', () => {
    const colliding = () =>
      buildRegistryContent(
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
    // Stage prefix + "Foo" → StageFoo; callback prefix + "StageFoo" → CallbackStageFoo.
    // Distinct identifiers, so this is NOT a collision — verify both registries emit.
    expect(colliding).not.toThrow();
    const output = colliding();
    expect(output).toContain('StageFoo');
    expect(output).toContain('CallbackStageFoo');
  });

  it('allows a header and footer with identifiers that remain distinct', () => {
    const distinct = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/brand/brand.svelte',
            name: 'Brand',
            type: 'header',
            acceptedProps: [],
            default: 'Brand',
          },
        ],
        [
          {
            filePath: '/repo/experimental/custom/footers/brand/brand.svelte',
            name: 'Brand',
            type: 'footer',
            acceptedProps: [],
            default: 'Brand',
          },
        ],
      );
    // CustomHeaderBrand vs CustomFooterBrand — distinct identifiers, both singletons emit.
    expect(distinct).not.toThrow();
    const output = distinct();
    expect(output).toContain('CustomHeaderBrand');
    expect(output).toContain('CustomFooterBrand');
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
    kind: 'stages' | 'callbacks' | 'headers' | 'footers',
    dirName: string,
    fileName: string,
    name: string,
    type: string,
    defaultName?: string,
  ) => {
    const dir = join(tmpDir, 'experimental', 'custom', kind, dirName);
    await mkdir(dir, { recursive: true });
    const defaultLine = defaultName ? `\n   Default: ${defaultName}` : '';
    await writeFile(
      join(dir, fileName),
      `<!--\n   @component\n   Type: ${type}\n   Name: ${name}${defaultLine}\n   -->\n<div></div>`,
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

  it('scans stages, callbacks, headers, and footers and emits all four registries with default pointers', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await writeComponent('callbacks', 'name', 'name.svelte', 'Name', 'callback');
    await writeComponent('headers', 'brand', 'brand.svelte', 'Brand', 'header', 'Brand');
    await writeComponent('footers', 'legal', 'legal.svelte', 'Legal', 'footer', 'Legal');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customStageRegistry');
    expect(output).toContain('customCallbackRegistry');
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customFooterRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('CustomHeaderBrand');
    expect(output).toContain('CustomFooterLegal');
    expect(output).toContain('export const customHeaderDefault: string | null = "Brand";');
    expect(output).toContain('export const customFooterDefault: string | null = "Legal";');
  });

  it('emits empty Records and null defaults when header/footer directories are empty', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customHeaderDefault: string | null = null;');
    expect(output).toContain('customFooterRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customFooterDefault: string | null = null;');
  });

  it('emits multiple header entries and the named default', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'One', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Two', 'header', 'Two');
    await run();

    const output = await readRegistry();
    expect(output).toContain('"One": {');
    expect(output).toContain('"Two": {');
    expect(output).toContain('export const customHeaderDefault: string | null = "Two";');
  });

  it('fails when no header component declares Default: (with entries present)', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'One', 'header');

    const result = await Effect.runPromise(
      Effect.either(runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer))),
    );
    if (result._tag !== 'Left') {
      throw new Error('Expected runRegistryScript to fail');
    }
    const error = result.left;
    if (!(error instanceof RegistryCollisionError)) {
      throw new Error(`Expected RegistryCollisionError, got: ${String(error)}`);
    }
    expect(error.kind).toBe('default-usage');
    expect(error.type).toBe('header');
    expect(error.message).toContain('one.svelte');
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

  it('watched dirs include headers and footers: a header add event regenerates the registry', async () => {
    const { customRegistry } = await import('./vite-plugin.js');
    const plugin = customRegistry({ projectRoot: tmpDir });
    const { server, listeners } = makeServer();
    (plugin as { configureServer: (server: unknown) => void }).configureServer(server);
    expect(server.watcher.on).toHaveBeenCalledWith('all', expect.any(Function));

    // Add a header component and fire the add event through the watcher listener.
    const headerDir = join(tmpDir, 'experimental', 'custom', 'headers', 'brand');
    await mkdir(headerDir, { recursive: true });
    await writeFile(
      join(headerDir, 'brand.svelte'),
      '<!--\n   @component\n   Type: header\n   Name: Brand\n   Default: Brand\n   -->\n<div></div>',
      'utf8',
    );
    expect(listeners.length).toBeGreaterThan(0);
    for (const listener of listeners) {
      listener('add', join(headerDir, 'brand.svelte'));
    }

    await vi.waitFor(async () => {
      const output = await readFile(registryPath(), 'utf8');
      expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
      expect(output).toContain('CustomHeaderBrand');
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

    // Add a header file OUTSIDE the watched dirs and fire the event.
    const outsideDir = join(tmpDir, 'experimental', 'elsewhere');
    await mkdir(outsideDir, { recursive: true });
    await writeFile(
      join(outsideDir, 'stray.svelte'),
      '<!--\n   @component\n   Type: header\n   Name: Stray\n   -->\n<div></div>',
      'utf8',
    );
    for (const listener of listeners) {
      listener('add', join(outsideDir, 'stray.svelte'));
    }
    await new Promise((resolve) => setTimeout(resolve, 100));

    const after = await readFile(registryPath(), 'utf8');
    expect(after).toBe(baseline);
    expect(after).not.toContain('CustomHeaderStray');
  });
});
