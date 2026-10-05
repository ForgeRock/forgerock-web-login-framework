/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Cause, Effect, Exit, Option } from 'effect';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { ComponentRepoError } from './component.types';
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
  const exit = await Effect.runPromiseExit(publishWith(repoDir)(bundle));
  if (Exit.isFailure(exit)) {
    throw new Error(
      `Expected the publish to succeed: ${Option.getOrThrow(Cause.failureOption(exit.cause))}`,
    );
  }
};

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

const runParseBundle = async (bundle: string) => Effect.runPromiseExit(parseBundle(bundle));

describe('parseBundle', () => {
  it('parses file entries and ignores unknown fields', async () => {
    const exit = await runParseBundle(
      '{"files":[{"path":"journeys/login.json","content":"{}","ignored":true}],"ignored":true}',
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual([{ relPath: 'journeys/login.json', content: '{}' }]);
    }
  });

  for (const bundle of [
    'not json',
    '{}',
    '{"files":[{}]}',
    '{"files":[{"path":"journeys/login.json"}]}',
    '{"files":[{"path":"../outside.json","content":"{}"}]}',
    '{"files":[{"path":".git/config","content":"{}"}]}',
  ]) {
    it(`rejects invalid bundle ${bundle}`, async () => {
      const exit = await runParseBundle(bundle);
      expect(Exit.isSuccess(exit)).toBe(false);
      if (Exit.isFailure(exit)) {
        const failure = Option.getOrThrow(Cause.failureOption(exit.cause)) as Error;
        expect(failure.message).toMatch(/bundle|unsafe path/i);
      }
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

    const exit = await Effect.runPromiseExit(publishWith(repoDir)(bundle));
    expect(Exit.isSuccess(exit)).toBe(false);
    if (Exit.isSuccess(exit)) {
      return;
    }
    const error = Option.getOrThrow(Cause.failureOption(exit.cause));
    expect(error._tag).toBe('ComponentPublishError');
    expect((error as { reason: string }).reason).toBe('Invalid');
    expect(await readDirectory(repoDir)).toEqual([]);
  });

  it('reports storage failures with the Storage reason', async () => {
    const cause = new Error('disk unavailable');
    const repoFailure = () =>
      Effect.fail(new ComponentRepoError({ message: 'disk unavailable', cause }));
    const publisher = createComponentPublisher(repoFailure);

    const exit = await Effect.runPromiseExit(
      publisher('{"files":[{"path":"bundle.js","content":"{}"}]}'),
    );
    expect(Exit.isSuccess(exit)).toBe(false);
    if (Exit.isSuccess(exit)) {
      return;
    }
    const error = Option.getOrThrow(Cause.failureOption(exit.cause)) as {
      reason: string;
      message: string;
    };
    expect(error.reason).toBe('Storage');
    expect(error.message).toBe('Unable to persist component bundle');
  });
});
