import { FetchHttpClient, FileSystem } from '@effect/platform';
import { SystemError } from '@effect/platform/Error';
import { Effect, Either, Layer } from 'effect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  makeGithubReleaseLayer,
  parseReleaseTags,
  Release,
  validateVersion,
} from '../src/services/release.js';

import type { Scope } from 'effect';

// ── Mock tar ──────────────────────────────────────────────────────────────────

vi.mock('tar', () => ({
  extract: vi.fn().mockResolvedValue(undefined),
}));

// Must be imported after vi.mock to get the mocked version
const { extract: mockExtract } = await import('tar');

// ── Test layer: uses FetchHttpClient so vi.stubGlobal('fetch',...) works ──────

const TestReleaseLayer = makeGithubReleaseLayer(FetchHttpClient.layer);

// ── Mock FileSystem layer ─────────────────────────────────────────────────────

function makeMockFsLayer(opts: { mkdirFail?: boolean; writeFail?: boolean } = {}) {
  return Layer.succeed(FileSystem.FileSystem, {
    makeDirectory: () =>
      opts.mkdirFail
        ? Effect.fail(
            new SystemError({
              reason: 'Unknown',
              module: 'FileSystem',
              method: 'makeDirectory',
              description: 'mkdir failed',
              pathOrDescriptor: 'Directory',
            }),
          )
        : Effect.void,
    writeFile: () =>
      opts.writeFail
        ? Effect.fail(
            new SystemError({
              reason: 'Unknown',
              module: 'FileSystem',
              method: 'writeFile',
              description: 'writeFile failed',
              pathOrDescriptor: 'File',
            }),
          )
        : Effect.void,
    remove: () => Effect.void,
  } as unknown as FileSystem.FileSystem);
}

// ── Helper: run an Effect requiring Release + FileSystem ──────────────────────

function withRelease<A>(
  fn: (r: Release['Type']) => Effect.Effect<A, unknown, FileSystem.FileSystem | Scope.Scope>,
  fsLayer = makeMockFsLayer(),
): Promise<Either.Either<A, unknown>> {
  return Effect.runPromise(
    Effect.scoped(
      Effect.either(Effect.flatMap(Release, fn)).pipe(
        Effect.provide(TestReleaseLayer),
        Effect.provide(fsLayer),
      ),
    ),
  );
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ── parseReleaseTags ──────────────────────────────────────────────────────────

describe('parseReleaseTags', () => {
  const run = (json: string) => Effect.runPromise(Effect.either(parseReleaseTags(json)));

  it('parses stable releases and excludes drafts and pre-releases', async () => {
    const json = JSON.stringify([
      { tag_name: 'v1.0.0', published_at: '2024-01-01T00:00:00Z', draft: false, prerelease: false },
      {
        tag_name: 'v1.1.0-beta',
        published_at: '2024-02-01T00:00:00Z',
        draft: false,
        prerelease: true,
      },
      { tag_name: 'v2.0.0', published_at: '2024-03-01T00:00:00Z', draft: false, prerelease: false },
    ]);
    const result = await run(json);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toEqual([
        { tag: 'v1.0.0', publishedAt: '2024-01-01' },
        { tag: 'v2.0.0', publishedAt: '2024-03-01' },
      ]);
    }
  });

  it('fails with ReleaseParseError for invalid JSON', async () => {
    const result = await run('not-json');
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe('ReleaseParseError');
    }
  });
});

// ── validateVersion ────────────────────────────────────────────────────────

describe('validateVersion', () => {
  const runV = (v: string) => Effect.runPromise(Effect.either(validateVersion(v)));

  it('accepts a legacy v-prefixed tag', async () => {
    expect(Either.isRight(await runV('v2.1.0'))).toBe(true);
  });

  it('accepts semver without v prefix', async () => {
    expect(Either.isRight(await runV('1.2.3'))).toBe(true);
  });

  it('accepts semver with prerelease tag', async () => {
    expect(Either.isRight(await runV('v1.0.0-beta.1'))).toBe(true);
  });

  it('accepts the login widget package tag', async () => {
    expect(Either.isRight(await runV('@forgerock/login-widget@2.1.0'))).toBe(true);
  });

  it('accepts the login widget package prerelease tag', async () => {
    expect(Either.isRight(await runV('@forgerock/login-widget@2.1.0-beta.1'))).toBe(true);
  });

  it('rejects invalid tags with InvalidVersionError', async () => {
    for (const bad of [
      'latest',
      'main',
      '1.0',
      'abc',
      '',
      '@forgerock/login-widget@2.1',
      '@forgerock/login-framework-cli@2.1.0',
    ]) {
      const result = await runV(bad);
      expect(Either.isLeft(result), `expected "${bad}" to fail`).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('InvalidVersionError');
      }
    }
  });
});

// ── archiveUrl ─────────────────────────────────────────────────────────────

describe('Release.archiveUrl', () => {
  it('generates the correct GitHub archive URL for a legacy tag', async () => {
    const result = await withRelease((r) => Effect.succeed(r.archiveUrl('v1.2.3')));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toBe(
        'https://github.com/ForgeRock/forgerock-web-login-framework/archive/refs/tags/v1.2.3.tar.gz',
      );
    }
  });

  it('generates the correct GitHub archive URL for a package tag', async () => {
    const result = await withRelease((r) =>
      Effect.succeed(r.archiveUrl('@forgerock/login-widget@2.1.0')),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toBe(
        'https://github.com/ForgeRock/forgerock-web-login-framework/archive/refs/tags/@forgerock/login-widget@2.1.0.tar.gz',
      );
    }
  });
});

// ── resolveLatest ──────────────────────────────────────────────────────────

describe('Release.resolveLatest', () => {
  it('returns the tag_name from the GitHub releases API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        text: () => Promise.resolve(JSON.stringify({ tag_name: 'v3.0.0' })),
      }),
    );
    const result = await withRelease((r) => r.resolveLatest());
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right).toBe('v3.0.0');
  });

  it('fails with ReleaseParseError when tag_name is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        text: () => Promise.resolve(JSON.stringify({})),
      }),
    );
    const result = await withRelease((r) => r.resolveLatest());
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseParseError');
    }
  });

  it('fails with ReleaseNetworkError when the HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404, headers: {}, text: () => Promise.resolve('') }),
    );
    const result = await withRelease((r) => r.resolveLatest());
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseNetworkError');
    }
  });
});

// ── fetch ──────────────────────────────────────────────────────────────────

describe('Release.fetch', () => {
  it('fails immediately for an invalid version (before any I/O)', async () => {
    const result = await withRelease((r) => r.fetch('not-a-semver', '/tmp'));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'InvalidVersionError');
    }
  });

  it('downloads a package tag from its GitHub archive URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: {},
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await withRelease((r) => r.fetch('@forgerock/login-widget@2.1.0', '/output'));

    expect(Either.isRight(result)).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0].toString()).toBe(
      'https://github.com/ForgeRock/forgerock-web-login-framework/archive/refs/tags/@forgerock/login-widget@2.1.0.tar.gz',
    );
  });

  it('fails with ReleaseFsError when makeDirectory fails', async () => {
    const result = await withRelease(
      (r) => r.fetch('v1.0.0', '/tmp'),
      makeMockFsLayer({ mkdirFail: true }),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseFsError');
    }
  });

  it('fails with ReleaseNetworkError when the download request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404, headers: {}, text: () => Promise.resolve('') }),
    );
    const result = await withRelease((r) => r.fetch('v1.0.0', '/tmp'));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseNetworkError');
    }
  });

  it('fails with ReleaseFsError when writeFile fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    );
    const result = await withRelease(
      (r) => r.fetch('v1.0.0', '/tmp'),
      makeMockFsLayer({ writeFail: true }),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseFsError');
    }
  });

  it('fails with ReleaseParseError when tar extraction fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    );
    vi.mocked(mockExtract).mockRejectedValueOnce(new Error('bad archive'));
    const result = await withRelease((r) => r.fetch('v1.0.0', '/tmp'));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseParseError');
    }
  });

  it('returns the temp directory path when all steps succeed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    );
    const result = await withRelease((r) => r.fetch('v1.0.0', '/output'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right).toBe('/output/.framework-tmp');
  });
});

// ── fetchBranch ────────────────────────────────────────────────────────────

describe('Release.fetchBranch', () => {
  it('fails with ReleaseFsError when makeDirectory fails', async () => {
    const result = await withRelease(
      (r) => r.fetchBranch('main', '/tmp'),
      makeMockFsLayer({ mkdirFail: true }),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseFsError');
    }
  });

  it('fails with ReleaseNetworkError when the download request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404, headers: {}, text: () => Promise.resolve('') }),
    );
    const result = await withRelease((r) => r.fetchBranch('main', '/tmp'));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toHaveProperty('_tag', 'ReleaseNetworkError');
    }
  });

  it('returns the temp directory path when all steps succeed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {},
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    );
    const result = await withRelease((r) => r.fetchBranch('main', '/output'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right).toBe('/output/.framework-tmp');
  });
});
