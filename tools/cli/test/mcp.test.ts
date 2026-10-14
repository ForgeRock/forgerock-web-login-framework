import { NodeContext } from '@effect/platform-node';
import { Effect, Either, Option } from 'effect';
import { mkdtemp, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { scaffoldComponent } from '../src/commands/generate.js';
import { initProject } from '../src/commands/init.js';

import type { FileSystem } from '@effect/platform';

const runEither = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(
    Effect.either(Effect.provide(eff, NodeContext.layer) as Effect.Effect<A, E, never>),
  );

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-mcp-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('scaffoldComponent (exported)', () => {
  it('returns an Effect when called with valid arguments', () => {
    expect(Effect.isEffect(scaffoldComponent('callback', 'MyCallback'))).toBe(true);
  });

  it('returns an Effect when called with an explicit directory', () => {
    expect(Effect.isEffect(scaffoldComponent('callback', 'MyCallback', '/some/path'))).toBe(true);
  });
});

describe('scaffoldComponent — directory parameter', () => {
  it('fails with GeneratorVersionError when directory has no .generator-version', async () => {
    const result = await runEither(
      scaffoldComponent('callback', 'MyCallback', tmpDir) as Effect.Effect<
        void,
        unknown,
        FileSystem.FileSystem
      >,
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('GeneratorVersionError');
    }
  });

  it('uses the explicit directory, not cwd', async () => {
    // otherDir has no .generator-version. If the directory param is respected,
    // the error path points into otherDir — not process.cwd().
    const otherDir = await mkdtemp(join(tmpdir(), 'ping-lf-other-'));
    try {
      const result = await runEither(
        scaffoldComponent('callback', 'MyCallback', otherDir) as Effect.Effect<
          void,
          unknown,
          FileSystem.FileSystem
        >,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const err = result.left as { _tag: string; path?: string };
        expect(err._tag).toBe('GeneratorVersionError');
        expect(err.path).toContain('ping-lf-other-');
      }
    } finally {
      await rm(otherDir, { recursive: true, force: true });
    }
  });

  it('expands tilde in the directory parameter', async () => {
    // ~/nonexistent-ping-lf-test should expand to homedir()/nonexistent-ping-lf-test.
    // The error path must contain homedir(), not a literal "~/".
    const result = await runEither(
      scaffoldComponent('callback', 'MyCallback', '~/nonexistent-ping-lf-test') as Effect.Effect<
        void,
        unknown,
        FileSystem.FileSystem
      >,
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      const err = result.left as { _tag: string; path?: string };
      expect(err._tag).toBe('GeneratorVersionError');
      expect(err.path).toContain(homedir());
      expect(err.path).not.toMatch(/^~\//);
    }
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

  it('mcpCommand is exported', async () => {
    const { mcpCommand } = await import('../src/mcp.js');
    expect(mcpCommand).toBeDefined();
  });
});
