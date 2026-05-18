import { Effect, Option } from 'effect';
import { describe, expect, it } from 'vitest';

import { scaffoldComponent } from '../src/commands/generate.js';
import { initProject } from '../src/commands/init.js';

describe('scaffoldComponent (exported)', () => {
  it('returns an Effect when called with valid arguments', () => {
    const result = scaffoldComponent('callback', 'MyCallback');
    expect(Effect.isEffect(result)).toBe(true);
  });
});

describe('initProject (exported)', () => {
  it('returns an Effect when called with valid arguments', () => {
    const result = initProject({
      directory: './test-project',
      local: Option.none(),
      version: Option.none(),
    });
    expect(Effect.isEffect(result)).toBe(true);
  });
});

describe('MCP tools', () => {
  it('defines five tools with correct names', async () => {
    const { mcpToolkit } = await import('../src/mcp.js');
    const toolNames = Object.keys((mcpToolkit as { tools: Record<string, unknown> })['tools']);
    expect(toolNames.sort()).toEqual(
      ['generate_callback', 'generate_stage', 'init', 'list_releases', 'update'].sort(),
    );
  });
});
