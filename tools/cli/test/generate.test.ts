import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { Schema } from 'effect';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CallbackNameSchema,
  scaffoldComponent,
  StageNameSchema,
} from '../src/commands/generate.js';

import type { FileSystem } from '@effect/platform';

// ── Helpers for integration tests ──────────────────────────────────────────

const runEffect = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(Effect.provide(eff, NodeContext.layer) as Effect.Effect<A, E, never>);

/** Creates the minimal on-disk structure that `scaffoldComponent` requires. */
async function createMinimalProject(dir: string): Promise<void> {
  // .generator-version required by assertValidProject
  await writeFile(
    join(dir, '.generator-version'),
    JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
    'utf8',
  );
  // empty custom component dirs (runRegistryScript scans these)
  await mkdir(join(dir, 'experimental', 'custom', 'callbacks'), { recursive: true });
  await mkdir(join(dir, 'experimental', 'custom', 'stages'), { recursive: true });
  // registry output dir (runRegistryScript writes here)
  await mkdir(join(dir, 'core', 'journey', '_utilities', 'registry'), { recursive: true });
}

// ── Schema helpers ─────────────────────────────────────────────────────────

const decodeCallback = Schema.decodeSync(CallbackNameSchema);
const decodeStage = Schema.decodeSync(StageNameSchema);

// ── Template substitution integration tests ─────────────────────────────────

describe('scaffoldComponent — template substitution', () => {
  let tmpDir: string;

  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-gen-test-'));
    await createMinimalProject(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('replaces __COMPONENT_NAME_PASCAL__ in callback template files', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));

    const storyFile = join(
      tmpDir,
      'experimental',
      'custom',
      'callbacks',
      'my-callback',
      'my-callback.story.svelte',
    );
    const content = await readFile(storyFile, 'utf8');

    expect(content).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(content).toContain('MyCallback');
  });

  it('replaces __COMPONENT_NAME_PASCAL__ with toPascalCase(name) for stage names with spaces', async () => {
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const storyFile = join(
      tmpDir,
      'experimental',
      'custom',
      'stages',
      'my-login-stage',
      'my-login-stage.story.svelte',
    );
    const content = await readFile(storyFile, 'utf8');

    expect(content).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(content).toContain('MyLoginStage');
  });

  it('replaces __COMPONENT_NAME_PASCAL__ in utilities.ts and utilities.test.ts', async () => {
    await runEffect(scaffoldComponent('callback', 'JWTLogin', tmpDir));

    const utilsFile = join(
      tmpDir,
      'experimental',
      'custom',
      'callbacks',
      'jwt-login',
      'jwt-login.utilities.ts',
    );
    const testFile = join(
      tmpDir,
      'experimental',
      'custom',
      'callbacks',
      'jwt-login',
      'jwt-login.utilities.test.ts',
    );

    const [utils, test] = await Promise.all([
      readFile(utilsFile, 'utf8'),
      readFile(testFile, 'utf8'),
    ]);

    expect(utils).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(utils).toContain('formatJWTLoginLabel');
    expect(test).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(test).toContain('formatJWTLoginLabel');
  });
});

describe('CallbackNameSchema', () => {
  describe('valid names — slug generation', () => {
    it('converts simple PascalCase', () => {
      expect(decodeCallback('MyCallback').slug).toBe('my-callback');
      expect(decodeCallback('DefaultLogin').slug).toBe('default-login');
    });

    it('handles acronyms at the end', () => {
      expect(decodeCallback('MyURL').slug).toBe('my-url');
      expect(decodeCallback('ParseJSON').slug).toBe('parse-json');
    });

    it('handles acronyms at the start', () => {
      expect(decodeCallback('JWTCallback').slug).toBe('jwt-callback');
      expect(decodeCallback('OTPLogin').slug).toBe('otp-login');
    });

    it('handles acronyms in the middle', () => {
      expect(decodeCallback('MyURLCallback').slug).toBe('my-url-callback');
      expect(decodeCallback('ParseJSONResponse').slug).toBe('parse-json-response');
    });

    it('handles single-segment names', () => {
      expect(decodeCallback('Login').slug).toBe('login');
    });

    it('preserves the original PascalCase name', () => {
      expect(decodeCallback('MyCallback').name).toBe('MyCallback');
    });
  });

  describe('invalid names — Java class names only', () => {
    const reject = (name: string) => expect(() => decodeCallback(name)).toThrow();

    it('rejects empty string', () => reject(''));
    it('rejects single character', () => reject('A'));

    it('rejects names starting with lowercase', () => {
      reject('myCallback');
      reject('callback');
    });

    it('rejects names starting with a digit', () => reject('2FA'));

    it('rejects names with spaces or special characters', () => {
      reject('My Callback');
      reject('My-Callback');
      reject('My/Callback');
      reject('My.Callback');
      reject('../evil');
    });
  });
});

describe('StageNameSchema', () => {
  describe('valid names — AM stage names are arbitrary strings', () => {
    it('accepts PascalCase (common AM convention)', () => {
      expect(decodeStage('DefaultLogin').name).toBe('DefaultLogin');
      expect(decodeStage('DefaultLogin').slug).toBe('defaultlogin');
    });

    it('accepts names with spaces', () => {
      expect(decodeStage('My Login Stage').slug).toBe('my-login-stage');
      expect(decodeStage('My Login Stage').name).toBe('My Login Stage');
    });

    it('accepts names with hyphens', () => {
      expect(decodeStage('my-login').slug).toBe('my-login');
    });

    it('accepts names with mixed separators', () => {
      expect(decodeStage('OTP Login').slug).toBe('otp-login');
    });

    it('preserves the original name', () => {
      expect(decodeStage('My Stage').name).toBe('My Stage');
    });
  });

  describe('invalid names — path traversal and empty strings rejected', () => {
    const reject = (name: string) => expect(() => decodeStage(name)).toThrow();

    it('rejects empty string', () => reject(''));
    it('rejects single character with no letters', () => reject('1'));
    it('rejects path traversal', () => {
      reject('../evil');
      reject('..\\evil');
    });
    it('rejects newlines', () => reject('My\nStage'));
    it('rejects null bytes', () => reject('My\x00Stage'));
  });
});
