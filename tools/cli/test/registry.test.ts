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
  parseEnabledState,
  RegistryCollisionError,
  RegistryEnabledLimitError,
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

  it('emits a Record header registry keyed by component name', () => {
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
      'export const customHeaderRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      '"Brand": { get component() { return CustomHeaderBrand; }, acceptedProps: [] },',
    );
  });

  it('emits empty Records when no header or footer component exists', () => {
    const output = buildRegistryContent(
      nodePath,
      '/repo/core/journey/_utilities/registry',
      [],
      [],
      [],
      [],
    );
    expect(output).toContain(
      'export const customHeaderRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      'export const customFooterRegistry: Record<string, CustomRegistryEntry> = {',
    );
  });

  it('emits a Record footer registry keyed by component name', () => {
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
      'export const customFooterRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      '"Legal": { get component() { return CustomFooterLegal; }, acceptedProps: [] },',
    );
  });

  it('throws RegistryEnabledLimitError when two header components are passed (at most one enabled)', () => {
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
    expect(twoHeaders).toThrow(RegistryEnabledLimitError);
    expect(twoHeaders).toThrow(/More than one header component is enabled/);
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

  it('throws RegistryEnabledLimitError instead of a collision error when 2+ enabled headers share a name', () => {
    const duplicate = () =>
      buildRegistryContent(
        nodePath,
        '/repo/core/journey/_utilities/registry',
        [],
        [],
        [
          {
            filePath: '/repo/experimental/custom/headers/a/brand.svelte',
            name: 'Brand',
            type: 'header',
            acceptedProps: [],
          },
          {
            filePath: '/repo/experimental/custom/headers/b/brand.svelte',
            name: 'Brand',
            type: 'header',
            acceptedProps: [],
          },
        ],
        [],
      );
    expect(duplicate).toThrow(RegistryEnabledLimitError);
    expect(duplicate).toThrow(/a\/brand\.svelte/);
    expect(duplicate).toThrow(/b\/brand\.svelte/);
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
    // CustomHeaderBrand vs CustomFooterBrand — distinct identifiers, both registries emit.
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

  it('ignores a legacy Default: line on a header component', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Default: OtherHeader\n   -->`;
    expect(decode('test.svelte', content)).toEqual({ type: 'header', name: 'MyHeader' });
  });

  it('fails when Name is "__proto__" (reserved object-literal key)', () => {
    const err = decodeError(
      'test.svelte',
      `<!-- @component\n   Type: header\n   Name: __proto__ -->`,
    );
    expect(String(err.cause)).toContain('Reserved key "__proto__"');
  });

  it('fails when Name is "constructor" (reserved object-literal key)', () => {
    const err = decodeError(
      'test.svelte',
      `<!-- @component\n   Type: footer\n   Name: constructor -->`,
    );
    expect(String(err.cause)).toContain('Reserved key "constructor"');
  });
});

describe('parseEnabledState', () => {
  it('returns enabled for Enabled: true', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Enabled: true\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'enabled' });
  });

  it('returns dormant for Enabled: false', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Enabled: false\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'dormant' });
  });

  it('returns dormant when Enabled is absent', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'dormant' });
  });

  it('returns dormant when there is no comment at all', () => {
    expect(parseEnabledState('<div>no header</div>')).toEqual({ state: 'dormant' });
  });

  it('is case-sensitive on the property name (enabled: true is inert)', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   enabled: true\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'dormant' });
  });

  it('ignores prose mentioning Enabled: when the property line is removed (dormant)', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n\n   "Enabled: true" opts this component into the bundle. Remove the line to disable.\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'dormant' });
  });

  it('finds the real property line even when prose mentions Enabled: before it', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Docs: set "Enabled: false" to disable.\n   Enabled: true\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'enabled' });
  });

  it('errors on an invalid Enabled value even though the file would be dormant', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Enabled: yes\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({
      error: expect.stringContaining('Invalid Enabled value "yes"'),
    });
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

  it('scans stages, callbacks, headers, and footers and emits all four registries', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await writeComponent('callbacks', 'name', 'name.svelte', 'Name', 'callback');
    await writeComponent('headers', 'brand', 'brand.svelte', 'Brand', 'header');
    await writeComponent('footers', 'legal', 'legal.svelte', 'Legal', 'footer');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customFooterRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('CustomHeaderBrand');
    expect(output).toContain('CustomFooterLegal');
  });

  it('emits empty Records when those directories are empty', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customFooterRegistry: Record<string, CustomRegistryEntry> = {');
  });

  it('excludes a dormant header (no Enabled: true) from the emitted Record', async () => {
    await writeComponent('headers', 'brand', 'brand.svelte', 'Brand', 'header', false);
    await run();

    const output = await readRegistry();
    expect(output).not.toContain('CustomHeaderBrand');
  });

  it('skips a dormant header entirely (invalid content does not fail the build)', async () => {
    const dormantDir = join(tmpDir, 'experimental', 'custom', 'headers', 'draft');
    await mkdir(dormantDir, { recursive: true });
    await writeFile(
      join(dormantDir, 'draft.svelte'),
      `<script>no component header at all</script>\n<div></div>`,
      'utf8',
    );
    await run();

    const output = await readRegistry();
    expect(output).not.toContain('CustomHeaderDraft');
  });

  it('fails when a dormant header has an invalid Enabled value', async () => {
    const invalidDir = join(tmpDir, 'experimental', 'custom', 'headers', 'bad');
    await mkdir(invalidDir, { recursive: true });
    await writeFile(
      join(invalidDir, 'bad.svelte'),
      `<!--\n   @component\n   Type: header\n   Name: Bad\n   Enabled: yes\n   -->\n<div></div>`,
      'utf8',
    );

    const result = await Effect.runPromise(
      Effect.either(runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer))),
    );
    if (result._tag !== 'Left') {
      throw new Error('Expected runRegistryScript to fail');
    }
    expect(String(result.left.cause)).toContain('Invalid Enabled value "yes"');
  });

  it('fails with a typed error when two enabled header components collide on a name', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'Same', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Same', 'header');

    const result = await Effect.runPromise(
      Effect.either(runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer))),
    );
    if (result._tag !== 'Left') {
      throw new Error('Expected runRegistryScript to fail');
    }
    if (!(result.left instanceof RegistryEnabledLimitError)) {
      throw new Error(`Expected RegistryEnabledLimitError, got: ${String(result.left)}`);
    }
    expect(result.left.type).toBe('header');
    expect(result.left.message).toContain('one.svelte');
    expect(result.left.message).toContain('two.svelte');
  });
});
