import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { NodeContext } from '@effect/platform-node';
import { scaffoldUserDirectory, scaffoldCi, scaffoldEnvExample } from '../src/commands/generate.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('scaffoldUserDirectory', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-gen-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('creates user/stage and user/callback directories', () =>
    scaffoldUserDirectory(targetDir).pipe(
      Effect.andThen(() => {
        expect(fs.existsSync(path.join(targetDir, 'user', 'callback'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'user', 'stage'))).toBe(true);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('copies demo callback component from templates', () =>
    scaffoldUserDirectory(targetDir).pipe(
      Effect.andThen(() => {
        const demoDir = path.join(targetDir, 'user', 'callback', 'demo-callback');
        expect(fs.existsSync(demoDir)).toBe(true);
        // Should have component.svelte and utility files
        expect(fs.existsSync(path.join(demoDir, 'component.svelte'))).toBe(true);
        expect(fs.existsSync(path.join(demoDir, 'utility.ts'))).toBe(true);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('copies demo stage component from templates', () =>
    scaffoldUserDirectory(targetDir).pipe(
      Effect.andThen(() => {
        const demoDir = path.join(targetDir, 'user', 'stage', 'demo-stage');
        expect(fs.existsSync(demoDir)).toBe(true);
        expect(fs.existsSync(path.join(demoDir, 'component.svelte'))).toBe(true);
        expect(fs.existsSync(path.join(demoDir, 'utility.ts'))).toBe(true);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('does NOT overwrite existing user content', () => {
    const existingDir = path.join(targetDir, 'user', 'callback', 'demo-callback');
    fs.mkdirSync(existingDir, { recursive: true });
    fs.writeFileSync(path.join(existingDir, 'component.svelte'), '<!-- custom content -->');

    return scaffoldUserDirectory(targetDir).pipe(
      Effect.andThen(() => {
        const content = fs.readFileSync(path.join(existingDir, 'component.svelte'), 'utf-8');
        expect(content).toBe('<!-- custom content -->');
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );
  });
});

describe('scaffoldCi', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-ci-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('creates .github/workflows/ci.yml', () =>
    scaffoldCi(targetDir).pipe(
      Effect.andThen(() => {
        const ciPath = path.join(targetDir, '.github', 'workflows', 'ci.yml');
        expect(fs.existsSync(ciPath)).toBe(true);
        const content = fs.readFileSync(ciPath, 'utf-8');
        expect(content).toContain('pnpm install');
        expect(content).toContain('name: CI');
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));
});

describe('scaffoldEnvExample', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-env-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('creates .env.example if it does not exist', () =>
    scaffoldEnvExample(targetDir).pipe(
      Effect.andThen(() => {
        const envPath = path.join(targetDir, '.env.example');
        expect(fs.existsSync(envPath)).toBe(true);
        const content = fs.readFileSync(envPath, 'utf-8');
        expect(content).toContain('VITE_FR_AM_URL');
        expect(content).toContain('VITE_FR_REALM_PATH');
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('does NOT overwrite existing .env.example', () => {
    const envPath = path.join(targetDir, '.env.example');
    fs.writeFileSync(envPath, 'EXISTING=true\n');

    return scaffoldEnvExample(targetDir).pipe(
      Effect.andThen(() => {
        const content = fs.readFileSync(envPath, 'utf-8');
        expect(content).toBe('EXISTING=true\n');
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );
  });
});
