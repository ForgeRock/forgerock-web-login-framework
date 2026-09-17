import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

  it('emits a singleton header registry for a single header component', () => {
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
      ],
      [],
    );
    expect(output).toContain(
      `import CustomHeaderBrand from '../../../../experimental/custom/headers/brand/brand.svelte';`,
    );
    expect(output).toContain(
      'export const customHeaderRegistry: CustomRegistryEntry | null = { get component() { return CustomHeaderBrand; }, acceptedProps: [] };',
    );
  });

  it('emits null when no header component exists', () => {
    const output = buildRegistryContent(nodePath, registryDir, [], [], [], []);
    expect(output).toContain(
      'export const customHeaderRegistry: CustomRegistryEntry | null = null;',
    );
  });

  it('emits a singleton footer registry for a single footer component', () => {
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
        },
      ],
    );
    expect(output).toContain(
      `import CustomFooterLegal from '../../../../experimental/custom/footers/legal/legal.svelte';`,
    );
    expect(output).toContain(
      'export const customFooterRegistry: CustomRegistryEntry | null = { get component() { return CustomFooterLegal; }, acceptedProps: [] };',
    );
  });

  it('emits null when no footer component exists', () => {
    const output = buildRegistryContent(nodePath, registryDir, [], [], [], []);
    expect(output).toContain(
      'export const customFooterRegistry: CustomRegistryEntry | null = null;',
    );
  });

  it('throws when two header components exist, even with distinct names (page-level singleton)', () => {
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
          },
        ],
        [],
      );
    expect(twoHeaders).toThrow(RegistryCollisionError);
    expect(twoHeaders).toThrow(/a\/one\.svelte/);
    expect(twoHeaders).toThrow(/b\/two\.svelte/);
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
          },
        ],
        [
          {
            filePath: '/repo/experimental/custom/footers/brand/brand.svelte',
            name: 'Brand',
            type: 'footer',
            acceptedProps: [],
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
  ) => {
    const dir = join(tmpDir, 'experimental', 'custom', kind, dirName);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, fileName),
      `<!--\n   @component\n   Type: ${type}\n   Name: ${name}\n   -->\n<div></div>`,
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

  it('scans stages, callbacks, headers, and footers and emits all four registries', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await writeComponent('callbacks', 'name', 'name.svelte', 'Name', 'callback');
    await writeComponent('headers', 'brand', 'brand.svelte', 'Brand', 'header');
    await writeComponent('footers', 'legal', 'legal.svelte', 'Legal', 'footer');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customStageRegistry');
    expect(output).toContain('customCallbackRegistry');
    expect(output).toContain('customHeaderRegistry: CustomRegistryEntry | null = {');
    expect(output).toContain('customFooterRegistry: CustomRegistryEntry | null = {');
    expect(output).toContain('CustomHeaderBrand');
    expect(output).toContain('CustomFooterLegal');
  });

  it('emits null header/footer registries when those directories are empty', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customHeaderRegistry: CustomRegistryEntry | null = null;');
    expect(output).toContain('customFooterRegistry: CustomRegistryEntry | null = null;');
  });

  it('fails with a clear error when two header components exist', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'One', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Two', 'header');

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
    expect(error.kind).toBe('singleton-occupancy');
    expect(error.type).toBe('header');
    expect(error.message).toContain('one.svelte');
    expect(error.message).toContain('two.svelte');
  });
});
