import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RegistryCollisionError, RegistryEnabledLimitError } from './registry.errors.js';
import {
  buildRegistryContent,
  parseAcceptedProps,
  parseComponentHeader,
  parseEnabledState,
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

    it('fails when Name is "__proto__" (would corrupt the generated Record literal)', () => {
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
    // The shipped template documents "remove this line to keep the component
    // dormant" while its prose mentions "Enabled: true" — that prose must not
    // parse as the property.
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n\n   "Enabled: true" opts this component into the bundle. Remove the line to disable.\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'dormant' });
  });

  it('finds the real property line even when prose mentions Enabled: before it', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Docs: set "Enabled: false" to disable.\n   Enabled: true\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'enabled' });
  });

  it('only treats lines that are the property: prose after a real false line does not win', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Enabled: false\n   Prose: "Enabled: true" is how you opt in.\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({ state: 'dormant' });
  });

  it('errors on an invalid Enabled value even though the file would be dormant', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Enabled: yes\n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({
      error: expect.stringContaining('Invalid Enabled value "yes"'),
    });
  });

  it('errors on an empty Enabled value', () => {
    const content = `<!--\n   @component\n   Type: header\n   Name: MyHeader\n   Enabled:   \n   -->\n<div>x</div>`;
    expect(parseEnabledState(content)).toEqual({
      error: expect.stringContaining('Invalid Enabled value ""'),
    });
  });
});

describe('buildRegistryContent enabled limit', () => {
  // buildRegistryContent's `registryDir` constant is declared in the
  // buildRegistryContent describe below; replicate it here for standalone use.
  const registryDir = '/repo/core/journey/_utilities/registry';

  // buildRegistryContent receives ONLY enabled components — scanDirectory
  // filters dormant header/footer files out before calling it — so every
  // header/footer entry passed here counts toward the at-most-one limit.
  const enabledHeader = (filePath: string, name: string) => ({
    filePath,
    name,
    type: 'header' as const,
    acceptedProps: [] as string[],
  });

  it('allows one enabled header', () => {
    const output = buildRegistryContent(
      nodePath,
      registryDir,
      [],
      [],
      [enabledHeader('/repo/experimental/custom/headers/a/one.svelte', 'One')],
    );
    expect(output).toContain('"One": {');
  });

  it('throws when two headers are enabled', () => {
    const twoEnabled = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          enabledHeader('/repo/experimental/custom/headers/a/one.svelte', 'One'),
          enabledHeader('/repo/experimental/custom/headers/b/two.svelte', 'Two'),
        ],
      );
    expect(twoEnabled).toThrow(RegistryEnabledLimitError);
    expect(twoEnabled).toThrow(/More than one header component is enabled/);
    expect(twoEnabled).toThrow(/a\/one\.svelte/);
    expect(twoEnabled).toThrow(/b\/two\.svelte/);
  });

  it('throws when two footers are enabled', () => {
    const twoEnabled = () =>
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
          {
            filePath: '/repo/experimental/custom/footers/b/two.svelte',
            name: 'Two',
            type: 'footer',
            acceptedProps: [],
          },
        ],
      );
    expect(twoEnabled).toThrow(RegistryEnabledLimitError);
    expect(twoEnabled).toThrow(/More than one footer component is enabled/);
  });

  it('reports the enabled limit before name collisions when both problems exist', () => {
    const both = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [],
        [],
        [
          enabledHeader('/repo/experimental/custom/headers/a/same.svelte', 'Same'),
          enabledHeader('/repo/experimental/custom/headers/b/same.svelte', 'Same'),
        ],
      );
    expect(both).toThrow(RegistryEnabledLimitError);
    expect(both).not.toThrow(RegistryCollisionError);
  });

  it('never enforces the enabled limit on stages and callbacks (always bundled)', () => {
    const multi = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
        [
          {
            filePath: '/repo/experimental/custom/stages/a/one.svelte',
            name: 'One',
            type: 'stage',
            acceptedProps: [],
          },
          {
            filePath: '/repo/experimental/custom/stages/b/two.svelte',
            name: 'Two',
            type: 'stage',
            acceptedProps: [],
          },
        ],
        [],
      );
    expect(multi).not.toThrow();
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

  it('emits a full Record for a header component', () => {
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
      'export const customHeaderRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      `"Brand": { get component() { return CustomHeaderBrand; }, acceptedProps: [] },`,
    );
  });

  it('emits a full Record for a footer component', () => {
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
      'export const customFooterRegistry: Record<string, CustomRegistryEntry> = {',
    );
    expect(output).toContain(
      `"Legal": { get component() { return CustomFooterLegal; }, acceptedProps: [] },`,
    );
  });

  it('does not emit default pointer exports', () => {
    const output = buildRegistryContent(nodePath, registryDir, [], [], [], []);
    expect(output).not.toContain('customHeaderDefault');
    expect(output).not.toContain('customFooterDefault');
  });

  it('emits empty Record braces for an empty header registry', () => {
    const output = buildRegistryContent(nodePath, registryDir, [], [], [], []);
    const headerBlock = output.slice(
      output.indexOf('customHeaderRegistry'),
      output.indexOf('customFooterRegistry'),
    );
    expect(headerBlock).toContain('};');
  });

  it('throws RegistryEnabledLimitError when two header components are passed (at most one enabled)', () => {
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
    expect(twoHeaders).toThrow(RegistryEnabledLimitError);
    expect(twoHeaders).toThrow(/More than one header component is enabled/);
  });

  it('throws RegistryEnabledLimitError instead of a collision error when 2+ enabled headers share a name', () => {
    const duplicate = () =>
      buildRegistryContent(
        nodePath,
        registryDir,
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
    // CustomHeaderBrand vs CustomFooterBrand — distinct identifiers, both registries emit.
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
    expect(output).toContain('customStageRegistry');
    expect(output).toContain('customCallbackRegistry');
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customFooterRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('CustomHeaderBrand');
    expect(output).toContain('CustomFooterLegal');
  });

  it('excludes a dormant header (no Enabled: true) from the emitted Record', async () => {
    await writeComponent('headers', 'brand', 'brand.svelte', 'Brand', 'header', false);
    await writeComponent('footers', 'legal', 'legal.svelte', 'Legal', 'footer', false);
    await run();

    const output = await readRegistry();
    expect(output).not.toContain('CustomHeaderBrand');
    expect(output).not.toContain('CustomFooterLegal');
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
  });

  it('excludes a dormant header even when its content is invalid (skip-entirely)', async () => {
    // Dormant files are skipped before any parsing: a file with a garbage header
    // but no Enabled: true must not fail the build.
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

  it('fails when two enabled header components exist', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'One', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Two', 'header');

    const result = await Effect.runPromise(
      Effect.either(runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer))),
    );
    if (result._tag !== 'Left') {
      throw new Error('Expected runRegistryScript to fail');
    }
    const error = result.left;
    if (!(error instanceof RegistryEnabledLimitError)) {
      throw new Error(`Expected RegistryEnabledLimitError, got: ${String(error)}`);
    }
    expect(error.type).toBe('header');
    expect(error.message).toContain('one.svelte');
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

  it('emits empty Records when header/footer directories are empty', async () => {
    await writeComponent('stages', 'login', 'login.svelte', 'Login', 'stage');
    await run();

    const output = await readRegistry();
    expect(output).toContain('customHeaderRegistry: Record<string, CustomRegistryEntry> = {');
    expect(output).toContain('customFooterRegistry: Record<string, CustomRegistryEntry> = {');
  });

  it('emits a single enabled header as a Record key and drops dormant headers', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'One', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Two', 'header', false);
    await run();

    const output = await readRegistry();
    expect(output).toContain('"One": {');
    expect(output).toContain('CustomHeaderOne');
    expect(output).not.toContain('CustomHeaderTwo');
  });

  it('fails when two enabled header components collide on a name', async () => {
    await writeComponent('headers', 'a', 'one.svelte', 'Same', 'header');
    await writeComponent('headers', 'b', 'two.svelte', 'Same', 'header');

    const result = await Effect.runPromise(
      Effect.either(runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer))),
    );
    if (result._tag !== 'Left') {
      throw new Error('Expected runRegistryScript to fail');
    }
    const error = result.left;
    if (!(error instanceof RegistryEnabledLimitError)) {
      throw new Error(`Expected RegistryEnabledLimitError, got: ${String(error)}`);
    }
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

    // Add an ENABLED header component and fire the add event through the watcher listener.
    const headerDir = join(tmpDir, 'experimental', 'custom', 'headers', 'brand');
    await mkdir(headerDir, { recursive: true });
    await writeFile(
      join(headerDir, 'brand.svelte'),
      '<!--\n   @component\n   Type: header\n   Name: Brand\n   Enabled: true\n   -->\n<div></div>',
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

  it('logs a stale-registry action sentence when a watcher regeneration collides on a name', async () => {
    const { customRegistry } = await import('./vite-plugin.js');
    const plugin = customRegistry({ projectRoot: tmpDir });

    // Seed a valid registry with one enabled header.
    const headerDir = join(tmpDir, 'experimental', 'custom', 'headers', 'brand');
    await mkdir(headerDir, { recursive: true });
    await writeFile(
      join(headerDir, 'brand.svelte'),
      '<!--\n   @component\n   Type: header\n   Name: Brand\n   Enabled: true\n   -->\n<div></div>',
      'utf8',
    );
    await runRegistryScript(tmpDir).pipe(Effect.provide(NodeContext.layer), Effect.runPromise);
    const baseline = await readFile(registryPath(), 'utf8');

    // Introduce a second ENABLED header with the SAME Name: — the regeneration collides.
    const collidingDir = join(tmpDir, 'experimental', 'custom', 'headers', 'other');
    await mkdir(collidingDir, { recursive: true });
    await writeFile(
      join(collidingDir, 'other.svelte'),
      '<!--\n   @component\n   Type: header\n   Name: Brand\n   Enabled: true\n   -->\n<div></div>',
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
