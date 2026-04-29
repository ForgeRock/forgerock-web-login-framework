import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Effect } from 'effect';
import { FileSystem } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';

import { isFrameworkDirectory } from '../src/services/file-system.js';

const provide = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(Effect.provide(eff, NodeContext.layer));

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-init-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('isFrameworkDirectory', () => {
  it('returns true for a dir with package.json + experimental/', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-project' }));
    await mkdir(join(tmpDir, 'experimental'), { recursive: true });

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(true);
  });

  it('returns true for a dir with package.json + pnpm-workspace.yaml', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-project' }));
    await writeFile(join(tmpDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(true);
  });

  it('returns true for a dir with all three indicators', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-project' }));
    await mkdir(join(tmpDir, 'experimental'), { recursive: true });
    await writeFile(join(tmpDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(true);
  });

  it('returns false for an empty directory', async () => {
    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });

  it('returns false for a directory with package.json but no framework indicators', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'unrelated-project' }));

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });

  it('returns false for experimental/ present but no package.json', async () => {
    await mkdir(join(tmpDir, 'experimental'), { recursive: true });

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });

  it('returns false for a non-existent directory', async () => {
    const result = await provide(isFrameworkDirectory(join(tmpDir, 'does-not-exist')));
    expect(result).toBe(false);
  });

  it('returns false for a directory with unrelated files only', async () => {
    await writeFile(join(tmpDir, 'README.md'), '# hello');
    await writeFile(join(tmpDir, 'index.js'), 'console.log("hi");');

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });
});
