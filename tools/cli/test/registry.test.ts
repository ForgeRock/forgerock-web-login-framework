import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildRegistryContent,
  parseAcceptedProps,
  parseComponentHeader,
  RegistryCollisionError,
  runRegistryScript,
} from '../src/services/registry.js';

const nodePath = Effect.runSync(
  Effect.provide(
    Effect.gen(function* () {
      return yield* Path.Path;
    }),
    NodeContext.layer,
  ),
);

describe('parseAcceptedProps', () => {
  it('extracts instance export let declarations from Svelte AST', () => {
    const content = `<script lang="ts">
export let name: string;
export let count = 0;
export let callback, style;
export const metadata = null;
</script>`;

    expect(parseAcceptedProps(content)).toEqual(['name', 'count', 'callback', 'style']);
  });

  it('ignores comments, markup text, module exports, and export const declarations', () => {
    const content = `<!-- export let fromMarkup -->
<script context="module">
export let moduleProp;
</script>
<script>
// export let fromComment
export const style = {};
export let callback;
</script>`;

    expect(parseAcceptedProps(content)).toEqual(['callback']);
  });

  it('returns no props when there is no instance script', () => {
    expect(parseAcceptedProps('<div>No props</div>')).toEqual([]);
  });
});

describe('buildRegistryContent', () => {
  it('uses lazy component getters and preserves raw component names', () => {
    const output = buildRegistryContent(
      nodePath,
      '/repo/core/journey/_utilities/registry',
      [
        {
          filePath: '/repo/experimental/custom/stages/my-login-stage/my-login-stage.svelte',
          name: 'My Login Stage',
          type: 'stage',
          acceptedProps: ['callback'],
        },
      ],
      [],
    );

    expect(output).toContain('import StageMyLoginStage from');
    expect(output).toContain(
      '"My Login Stage": { get component() { return StageMyLoginStage; }, acceptedProps: ["callback"] },',
    );
    expect(output).not.toContain('component: StageMyLoginStage');
  });

  it('emits a singleton header registry for a single header component', () => {
    const output = buildRegistryContent(
      nodePath,
      '/repo/core/journey/_utilities/registry',
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

  it('emits null when no header or footer component exists', () => {
    const output = buildRegistryContent(
      nodePath,
      '/repo/core/journey/_utilities/registry',
      [],
      [],
      [],
      [],
    );
    expect(output).toContain(
      'export const customHeaderRegistry: CustomRegistryEntry | null = null;',
    );
    expect(output).toContain(
      'export const customFooterRegistry: CustomRegistryEntry | null = null;',
    );
  });

  it('emits a singleton footer registry for a single footer component', () => {
    const output = buildRegistryContent(
      nodePath,
      '/repo/core/journey/_utilities/registry',
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

  it('throws when two header components exist, even with distinct names (page-level singleton)', () => {
    const twoHeaders = () =>
      buildRegistryContent(
        nodePath,
        '/repo/core/journey/_utilities/registry',
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
    expect(twoHeaders).toThrow(/Only one header component is allowed/);
    expect(twoHeaders).toThrow(/a\/one\.svelte/);
    expect(twoHeaders).toThrow(/b\/two\.svelte/);
  });

  it('throws when two components share a registry key (exact duplicate name)', () => {
    const duplicate = () =>
      buildRegistryContent(
        nodePath,
        '/repo/core/journey/_utilities/registry',
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
    expect(duplicate).toThrow(RegistryCollisionError);
    expect(duplicate).toThrow(/Duplicate component name "StageLogin" in type "stage"/);
    expect(duplicate).toThrow(/a\/login\.svelte/);
    expect(duplicate).toThrow(/b\/login\.svelte/);
  });

  it('throws when distinct names collide in the generated identifier ("My Login" vs "MyLogin")', () => {
    const colliding = () =>
      buildRegistryContent(
        nodePath,
        '/repo/core/journey/_utilities/registry',
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

  it('allows a header and footer with identifiers that remain distinct', () => {
    const distinct = () =>
      buildRegistryContent(
        nodePath,
        '/repo/core/journey/_utilities/registry',
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

describe('parseComponentHeader', () => {
  const decode = (filePath: string, content: string) =>
    Effect.runSync(parseComponentHeader(filePath, content));

  const decodeError = (filePath: string, content: string) =>
    Effect.runSync(Effect.flip(parseComponentHeader(filePath, content)));

  it('parses a header component header', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   -->\n<div>branding</div>`;
    expect(decode('test.svelte', content)).toEqual({ type: 'header', name: 'MyHeader' });
  });

  it('parses a footer component header', () => {
    const content = `<!--\n   @component\n   Type: footer\n   Name: MyFooter\n   -->\n<div>legal</div>`;
    expect(decode('test.svelte', content)).toEqual({ type: 'footer', name: 'MyFooter' });
  });

  it('fails when Type value is an unknown custom component type', () => {
    const err = decodeError('test.svelte', `<!-- @component\n   Type: container\n   Name: Foo -->`);
    expect(String(err.cause)).toContain('Invalid Type value');
  });
});

describe('runRegistryScript', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cli-registry-test-'));
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

  it('fails with a typed error when two header components exist', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'One', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Two', 'header');

    const result = await Effect.runPromise(
      Effect.either(runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer))),
    );
    if (result._tag !== 'Left') {
      throw new Error('Expected runRegistryScript to fail');
    }
    if (!(result.left instanceof RegistryCollisionError)) {
      throw new Error(`Expected RegistryCollisionError, got: ${String(result.left)}`);
    }
    expect(result.left.kind).toBe('singleton-occupancy');
    expect(result.left.type).toBe('header');
    expect(result.left.message).toContain('one.svelte');
    expect(result.left.message).toContain('two.svelte');
  });
});
