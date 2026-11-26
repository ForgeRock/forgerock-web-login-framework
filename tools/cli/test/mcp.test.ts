import { NodeContext } from '@effect/platform-node';
import { Cause, Effect, Either, Exit, Layer, Option } from 'effect';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { scaffoldComponent } from '../src/commands/generate.js';
import { initProject } from '../src/commands/init.js';

import type { FileSystem, Path } from '@effect/platform';

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

// ── SDKS-5510: tool-description contract (audit item 3 / 11 / 17 / 18) ──────
//
// The tool descriptions are the only authoring guidance an MCP client LLM
// sees before writing code. Pin the paths, the curated-surface import rule,
// the stage-name rule, and the sandbox wording so they cannot regress.

describe('MCP tool descriptions — SDKS-5510 contract', () => {
  const getTool = async (name: string) => {
    const { mcpToolkit } = await import('../src/mcp.js');
    const tools = (mcpToolkit as unknown as { tools: Record<string, { description: string }> })
      .tools;
    const tool = tools[name];
    if (!tool) {
      throw new Error(`tool "${name}" not found in toolkit`);
    }
    return tool;
  };

  it('generate_callback description names the callbacks path and curated-surface import rule', async () => {
    const tool = await getTool('generate_callback');
    expect(tool.description).toContain('custom/components/callbacks/');
    expect(tool.description).toContain('$login-framework');
    expect(tool.description).toContain('$core');
    expect(tool.description).toContain('boundary');
  });

  it('generate_stage description names the stages path, curated-surface import rule, and prop rules', async () => {
    const tool = await getTool('generate_stage');
    expect(tool.description).toContain('custom/components/stages/');
    expect(tool.description).toContain('$login-framework');
    expect(tool.description).toContain('form.submit()');
    expect(tool.description).toContain('journey.loading');
  });

  it('generate_stage description states stage names are not constrained to PascalCase', async () => {
    const tool = await getTool('generate_stage');
    expect(tool.description).toContain('not constrained to PascalCase');
  });

  it('update description describes the whole custom/ sandbox, not just custom/components/', async () => {
    const tool = await getTool('update');
    expect(tool.description).toMatch(/custom\/\s/);
    expect(tool.description).toContain('customer-owned');
  });

  it('directory parameter description allows relative paths', async () => {
    const tool = await getTool('generate_callback');
    const descriptionAnnotation = Symbol.for('effect/annotation/Description');
    const descriptions: string[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') {
        return;
      }
      const annotations = (node as { annotations?: Record<symbol, unknown> }).annotations;
      if (annotations) {
        const description = annotations[descriptionAnnotation];
        if (typeof description === 'string') {
          descriptions.push(description);
        }
      }
      for (const value of Object.values(node as Record<string, unknown>)) {
        if (value && typeof value === 'object') {
          walk(value);
        }
      }
    };
    walk((tool as unknown as { parametersSchema: { ast: unknown } }).parametersSchema.ast);
    const directoryDescription = descriptions.find((d) => d.includes('project root'));
    expect(directoryDescription).toBeDefined();
    expect(directoryDescription).not.toContain('Absolute path');
  });
});

// ── SDKS-5510: tool annotations (audit item 8) ──────────────────────────────
//
// generate tools only create a new directory (they fail on an existing one),
// so they must not be flagged Destructive: strict MCP clients would
// confirmation-gate every scaffold call.

describe('MCP tool annotations', () => {
  const getAnnotation = async (
    name: string,
    tag: 'Destructive' | 'Idempotent' | 'OpenWorld' | 'Readonly',
  ) => {
    const { mcpToolkit } = await import('../src/mcp.js');
    const { Context } = await import('effect');
    const { Tool } = await import('@effect/ai');
    const tool = (
      mcpToolkit as unknown as { tools: Record<string, { annotations: Context.Context<never> }> }
    ).tools[name];
    if (!tool) {
      throw new Error(`tool "${name}" not found in toolkit`);
    }
    const annotationTags = {
      Destructive: Tool.Destructive,
      Idempotent: Tool.Idempotent,
      OpenWorld: Tool.OpenWorld,
      Readonly: Tool.Readonly,
    } as const;
    return Context.get(tool.annotations, annotationTags[tag]);
  };

  it('generate_callback is not destructive, not open-world, not idempotent', async () => {
    expect(await getAnnotation('generate_callback', 'Destructive')).toBe(false);
    expect(await getAnnotation('generate_callback', 'OpenWorld')).toBe(false);
    expect(await getAnnotation('generate_callback', 'Idempotent')).toBe(false);
  });

  it('generate_stage is not destructive, not open-world, not idempotent', async () => {
    expect(await getAnnotation('generate_stage', 'Destructive')).toBe(false);
    expect(await getAnnotation('generate_stage', 'OpenWorld')).toBe(false);
    expect(await getAnnotation('generate_stage', 'Idempotent')).toBe(false);
  });

  it('update stays destructive and open-world', async () => {
    expect(await getAnnotation('update', 'Destructive')).toBe(true);
    expect(await getAnnotation('update', 'OpenWorld')).toBe(true);
  });

  it('init stays destructive and open-world', async () => {
    expect(await getAnnotation('init', 'Destructive')).toBe(true);
    expect(await getAnnotation('init', 'OpenWorld')).toBe(true);
  });

  it('list_releases is readonly, idempotent, and not destructive', async () => {
    expect(await getAnnotation('list_releases', 'Readonly')).toBe(true);
    expect(await getAnnotation('list_releases', 'Idempotent')).toBe(true);
    expect(await getAnnotation('list_releases', 'Destructive')).toBe(false);
  });
});

// ── SDKS-5510: handler wiring (audit items 2 / 5 / 7 / 9 / 10 / 12 / 13) ────
//
// mcpToolkit.toLayer handlers were previously untested: argument mapping,
// success-text construction, and error formatting had no pins. Drive each
// tool through the handler layer against temp fixtures.

describe('MCP tool handlers', () => {
  let projectDir: string;

  const createProject = async (dir: string): Promise<void> => {
    const { mkdir, writeFile } = await import('node:fs/promises');
    await writeFile(
      join(dir, '.generator-version'),
      JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
      'utf8',
    );
    await mkdir(join(dir, 'custom', 'components', 'callbacks'), { recursive: true });
    await mkdir(join(dir, 'custom', 'components', 'stages'), { recursive: true });
  };

  beforeEach(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'ping-lf-mcp-handler-'));
    await createProject(projectDir);
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  const runHandle = async (name: string, params: Record<string, unknown>) => {
    const { handlerLayer, mcpToolkit } = await import('../src/mcp.js');
    const { GithubReleaseLayer } = await import('../src/services/release.js');
    // A Toolkit IS an Effect that resolves to the WithHandler record once the
    // handler layer is provided to it; the layer opens a Scope, so the provide
    // runs inside Effect.scoped. Handler effects require FileSystem/Path and
    // the update/init handlers need the GitHub release service, all met here.
    // Tools use the default failureMode 'error': a handler failure surfaces as
    // a failed Effect whose error IS the formatted message string, so both
    // channels are normalized to { isFailure, encodedResult } here.
    const handled = (await Effect.runPromise(
      Effect.scoped(
        Effect.provide(
          mcpToolkit as unknown as Effect.Effect<
            {
              handle: (
                n: string,
                p: Record<string, unknown>,
              ) => Effect.Effect<
                { isFailure: boolean; encodedResult: unknown },
                never,
                FileSystem.FileSystem | Path.Path
              >;
            },
            never,
            never
          >,
          Layer.mergeAll(handlerLayer, NodeContext.layer, GithubReleaseLayer) as Layer.Layer<
            never,
            never,
            never
          >,
        ),
      ),
    )) as {
      handle: (
        n: string,
        p: Record<string, unknown>,
      ) => Effect.Effect<
        { isFailure: boolean; encodedResult: unknown },
        unknown,
        FileSystem.FileSystem | Path.Path
      >;
    };
    const outcome = await Effect.runPromise(
      Effect.exit(Effect.provide(handled.handle(name, params as never), NodeContext.layer)),
    );
    if (Exit.isSuccess(outcome)) {
      return outcome.value;
    }
    // failureMode 'error': the failure is the formatted message string.
    const message = Cause.squash(outcome.cause);
    return { isFailure: true, encodedResult: String(message) };
  };

  it('generate_callback handler scaffolds into the directory parameter (not cwd)', async () => {
    const result = await runHandle('generate_callback', {
      name: 'MyCallback',
      directory: projectDir,
    });
    expect(result.isFailure).toBe(false);
    const scaffolded = await readFile(
      join(projectDir, 'custom', 'components', 'callbacks', 'my-callback', 'my-callback.svelte'),
      'utf8',
    );
    expect(scaffolded).toContain('MyCallback');
  });

  it('generate_stage handler accepts a stage name with spaces and reports failure text otherwise', async () => {
    const ok = await runHandle('generate_stage', {
      name: 'My Login Stage',
      directory: projectDir,
    });
    expect(ok.isFailure).toBe(false);

    const bad = await runHandle('generate_stage', { name: 'x', directory: projectDir });
    expect(bad.isFailure).toBe(true);
    // The stage-relevant guidance must be present; PascalCase-only wording
    // (the old callback-first message) must not be the whole story.
    expect(String(bad.encodedResult)).toContain('stage names are not constrained to PascalCase');
  });

  it('generate_callback failure text uses the PascalCase wording', async () => {
    const bad = await runHandle('generate_callback', { name: 'not-valid', directory: projectDir });
    expect(bad.isFailure).toBe(true);
    expect(String(bad.encodedResult)).toContain('For callbacks, use PascalCase');
  });

  it('generate handler success text names the scaffold location and next step', async () => {
    const result = await runHandle('generate_stage', {
      name: 'My Login Stage',
      directory: projectDir,
    });
    expect(result.isFailure).toBe(false);
    const text = String(result.encodedResult);
    expect(text).toContain('custom/components/stages/');
    expect(text).toContain('My Login Stage');
  });

  it('generate_callback into an existing component fails with the already-exists message', async () => {
    await runHandle('generate_callback', { name: 'MyCallback', directory: projectDir });
    const again = await runHandle('generate_callback', {
      name: 'MyCallback',
      directory: projectDir,
    });
    expect(again.isFailure).toBe(true);
    expect(String(again.encodedResult)).toContain('already exists');
  });

  it('generate without a project root fails with the init remediation', async () => {
    const noProject = await mkdtemp(join(tmpdir(), 'ping-lf-mcp-noproject-'));
    try {
      const bad = await runHandle('generate_callback', {
        name: 'MyCallback',
        directory: noProject,
      });
      expect(bad.isFailure).toBe(true);
      const text = String(bad.encodedResult);
      expect(text).toContain('Run the init tool first');
    } finally {
      await rm(noProject, { recursive: true, force: true });
    }
  });
});
