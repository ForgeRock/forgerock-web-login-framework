import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildRegistryContent, parseAcceptedProps } from '../src/services/registry.js';

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
});
