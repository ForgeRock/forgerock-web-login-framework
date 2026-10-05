/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Cause, Effect, Exit } from 'effect';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { fileSyncNoop } from './file-sync';
import { createComponentRepo } from './repo';

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'repo-'));
  temporaryDirectories.push(directory);
  return directory;
};

const saveWith = (repoDir: string) =>
  createComponentRepo({ repoDir, trackedSubpath: 'config' }, fileSyncNoop);

const saveEffect = (repoDir: string, relPath: string, content: string) =>
  saveWith(repoDir)([{ relPath, content }]);

const save = (repoDir: string, relPath: string, content: string) =>
  Effect.runPromise(saveEffect(repoDir, relPath, content)) as Promise<void>;

const saveArtifactsEffect = (
  repoDir: string,
  artifacts: ReadonlyArray<{ relPath: string; content: string }>,
) => saveWith(repoDir)(artifacts);

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('createComponentRepo', () => {
  it('writes a component below the tracked repository subpath', async () => {
    const repoDir = await makeTemporaryDirectory();

    await save(repoDir, 'journeys/login.json', '{"journey":"login"}');

    expect(await readUtf8(join(repoDir, 'config', 'journeys', 'login.json'))).toBe(
      '{"journey":"login"}',
    );
  });

  for (const relPath of [
    '../outside.json',
    '/outside.json',
    '.git/config',
    'journeys/.git/config',
    '\\outside.json',
    '',
  ]) {
    it(`rejects unsafe relative path ${relPath}`, async () => {
      const repoDir = await makeTemporaryDirectory();

      const exit = await Effect.runPromiseExit(saveEffect(repoDir, relPath, '{}'));
      if (Exit.isSuccess(exit)) {
        throw new Error('Expected the save to fail');
      }
      const failure = Cause.prettyErrors(exit.cause).at(-1) as Error;
      expect(failure.message).toMatch(/unsafe component path/i);
    });
  }

  it('atomically swaps complete component content for concurrent readers', async () => {
    const repoDir = await makeTemporaryDirectory();
    const destination = join(repoDir, 'config', 'journeys', 'login.json');
    const oldContent = JSON.stringify({ version: 'old', payload: 'a'.repeat(50_000) });
    const newContents = Array.from({ length: 25 }, (_, version) =>
      JSON.stringify({ version, payload: String(version).repeat(50_000) }),
    );

    await save(repoDir, 'journeys/login.json', oldContent);

    const observed = new Set<string>();
    let writing = true;
    const reader = (async () => {
      while (writing) {
        observed.add(await readFile(destination, 'utf8'));
      }
    })();

    for (const content of newContents) {
      await save(repoDir, 'journeys/login.json', content);
    }
    writing = false;
    await reader;

    const allowed = new Set([oldContent, ...newContents]);
    for (const content of observed) {
      expect(allowed.has(content)).toBe(true);
      expect(JSON.parse(content)).toHaveProperty('payload');
    }
  });

  it('removes the temporary file after a successful atomic rename', async () => {
    const repoDir = await makeTemporaryDirectory();

    await save(repoDir, 'journeys/login.json', '{}');

    expect(await readDirectory(join(repoDir, 'config', 'journeys'))).toEqual(['login.json']);
  });

  it('validates every artifact before creating temporary files', async () => {
    const repoDir = await makeTemporaryDirectory();

    const exit = await Effect.runPromiseExit(
      saveArtifactsEffect(repoDir, [
        { relPath: 'journeys/login.json', content: '{}' },
        { relPath: '../outside.json', content: '{}' },
      ]),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    expect(await readDirectory(repoDir)).toEqual([]);
  });
});
