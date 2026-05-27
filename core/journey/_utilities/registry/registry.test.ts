import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import {
  buildRegistryContent,
  parseAcceptedProps,
  parseComponentHeader,
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
});
