/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Cause, Effect, Exit, Layer, Option, Runtime } from 'effect';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { joinPath, WriterLive } from './artifact-writer';
import { ArtifactWriterError, FileSync, Publish, Writer } from './component.types';
import { parseBundle, PublishLive } from './publisher';

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'publisher-'));
  temporaryDirectories.push(directory);
  return directory;
};

const fileSyncLayer = Layer.succeed(FileSync, {
  fsync: () => Effect.void,
});

const makePublishRuntime = async (repoDir: string) =>
  Effect.runPromise(
    Layer.toRuntime(
      PublishLive.pipe(
        Layer.provide(WriterLive({ trackedRoot: joinPath(repoDir, 'config') })),
        Layer.provide(fileSyncLayer),
      ),
    ).pipe(Effect.scoped),
  );

const makeFailingWriterRuntime = async () =>
  Effect.runPromise(
    Layer.toRuntime(
      PublishLive.pipe(
        Layer.provide(
          Layer.succeed(Writer, () =>
            Effect.fail(new ArtifactWriterError({ message: 'disk unavailable' })),
          ),
        ),
      ),
    ).pipe(Effect.scoped),
  );

const publishEffect = (bundle: string) => Effect.flatMap(Publish, (publish) => publish(bundle));

const publish = async (runtime: Runtime.Runtime<Publish>, repoDir: string, bundle: string) => {
  const exit = await Runtime.runPromiseExit(runtime)(publishEffect(bundle));
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

describe('PublishLive', () => {
  it('publishes every bundle file through the component repo', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makePublishRuntime(repoDir);

    await publish(
      runtime,
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
    const runtime = await makePublishRuntime(repoDir);
    const bundle =
      '{"files":[{"path":"journeys/login.json","content":"{}"},{"path":"../outside.json","content":"{}"}]}';

    const exit = await Runtime.runPromiseExit(runtime)(publishEffect(bundle));
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
    const runtime = await makeFailingWriterRuntime();

    const exit = await Runtime.runPromiseExit(runtime)(
      publishEffect('{"files":[{"path":"bundle.js","content":"{}"}]}'),
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
