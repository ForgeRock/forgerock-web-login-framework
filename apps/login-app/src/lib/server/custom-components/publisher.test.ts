/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { fileSyncNoop } from './file-sync';
import { createComponentPublisher, parseBundle } from './publisher';
import { createComponentRepo } from './repo';

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'publisher-'));
  temporaryDirectories.push(directory);
  return directory;
};

const publishWith = (repoDir: string) => {
  const repo = createComponentRepo({ repoDir, trackedSubpath: 'config' }, fileSyncNoop);
  return createComponentPublisher(repo);
};

const publish = async (repoDir: string, bundle: string) => {
  const result = await publishWith(repoDir)(bundle);
  if (!result.success) {
    throw new Error(`Expected the publish to succeed: ${result.error.message}`);
  }
};

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('parseBundle', () => {
  it('parses file entries and ignores unknown fields', () => {
    const result = parseBundle(
      '{"files":[{"path":"journeys/login.json","content":"{}","ignored":true}],"ignored":true}',
    );

    expect(result).toEqual([{ relPath: 'journeys/login.json', content: '{}' }]);
  });

  for (const bundle of [
    'not json',
    '{}',
    '{"files":[{}]}',
    '{"files":[{"path":"journeys/login.json"}]}',
    '{"files":[{"path":"../outside.json","content":"{}"}]}',
    '{"files":[{"path":".git/config","content":"{}"}]}',
  ]) {
    it(`rejects invalid bundle ${bundle}`, () => {
      expect(() => parseBundle(bundle)).toThrow(/bundle|unsafe path/i);
    });
  }
});

describe('createComponentPublisher', () => {
  it('publishes every bundle file through the component repo', async () => {
    const repoDir = await makeTemporaryDirectory();

    await publish(
      repoDir,
      '{"files":[{"path":"journeys/login.json","content":"{\\"journey\\":\\"login\\"}"},{"path":"themes/main.json","content":"{}"}]}',
    );

    expect(await readUtf8(join(repoDir, 'config', 'journeys', 'login.json'))).toBe(
      '{"journey":"login"}',
    );
    expect(await readUtf8(join(repoDir, 'config', 'themes', 'main.json'))).toBe('{}');
  });

  it('validates all artifacts before writing any file', async () => {
    const repoDir = await makeTemporaryDirectory();
    const bundle =
      '{"files":[{"path":"journeys/login.json","content":"{}"},{"path":"../outside.json","content":"{}"}]}';

    const result = await publishWith(repoDir)(bundle);
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.reason).toBe('Invalid');
    expect(await readDirectory(repoDir)).toEqual([]);
  });

  it('reports storage failures with the Storage reason', async () => {
    const repoFailure = async () => {
      throw new Error('disk unavailable');
    };
    const publisher = createComponentPublisher(repoFailure);

    const result = await publisher('{"files":[{"path":"bundle.js","content":"{}"}]}');
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.reason).toBe('Storage');
    expect(result.error.message).toBe('Unable to persist component bundle');
  });
});
