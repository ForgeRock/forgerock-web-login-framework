import { Context, Effect, Layer, Scope, Schema } from 'effect';
import { FileSystem, HttpClient, HttpClientResponse } from '@effect/platform';
import { NodeHttpClient } from '@effect/platform-node';
import { extract } from 'tar';
import {
  InvalidVersionError,
  ReleaseFsError,
  ReleaseNetworkError,
  ReleaseNotFoundError,
  ReleaseParseError,
} from '../errors.js';

const REPO = 'ForgeRock/forgerock-web-login-framework';

const API_HEADERS = {
  'User-Agent': 'ping-lf-cli',
  Accept: 'application/vnd.github.v3+json',
};

const VERSION_REGEX = /^v?\d+\.\d+\.\d+(-[\w.]+)?$/;

const toCauseString = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export function validateVersion(version: string): Effect.Effect<string, InvalidVersionError> {
  return VERSION_REGEX.test(version)
    ? Effect.succeed(version)
    : Effect.fail(new InvalidVersionError({ version }));
}

const GithubReleaseSchema = Schema.Struct({
  tag_name: Schema.String,
  published_at: Schema.String,
  draft: Schema.Boolean,
  prerelease: Schema.Boolean,
});

const decodeGithubReleases = Schema.decodeUnknown(
  Schema.parseJson(Schema.Array(GithubReleaseSchema)),
);

/**
 * Parses a GitHub releases API JSON response and returns an array of
 * `{ tag, publishedAt }` objects, excluding drafts and pre-releases.
 */
export function parseReleaseTags(
  json: string,
): Effect.Effect<Array<{ tag: string; publishedAt: string }>, ReleaseParseError> {
  return decodeGithubReleases(json).pipe(
    Effect.map((releases) =>
      releases
        .filter((r) => !r.draft && !r.prerelease)
        .map((r) => ({ tag: r.tag_name, publishedAt: r.published_at.slice(0, 10) })),
    ),
    Effect.mapError((cause) => new ReleaseParseError({ cause: toCauseString(cause) })),
  );
}

export class Release extends Context.Tag('Release')<
  Release,
  {
    readonly archiveUrl: (version: string) => string;
    readonly resolveLatest: () => Effect.Effect<string, ReleaseNetworkError | ReleaseParseError>;
    readonly listReleases: () => Effect.Effect<
      Array<{ tag: string; publishedAt: string }>,
      ReleaseNetworkError | ReleaseParseError | ReleaseNotFoundError
    >;
    readonly fetch: (
      version: string,
      targetDir: string,
    ) => Effect.Effect<
      string,
      InvalidVersionError | ReleaseFsError | ReleaseNetworkError | ReleaseParseError,
      FileSystem.FileSystem | Scope.Scope
    >;
    readonly fetchBranch: (
      branch: string,
      targetDir: string,
    ) => Effect.Effect<
      string,
      ReleaseFsError | ReleaseNetworkError | ReleaseParseError,
      FileSystem.FileSystem | Scope.Scope
    >;
  }
>() {}

const LatestReleaseSchema = Schema.Struct({ tag_name: Schema.String });
const decodeLatestRelease = Schema.decodeUnknown(Schema.parseJson(LatestReleaseSchema));

const downloadAndExtract = (
  http: HttpClient.HttpClient,
  url: string,
  targetDir: string,
): Effect.Effect<
  string,
  ReleaseFsError | ReleaseNetworkError | ReleaseParseError,
  FileSystem.FileSystem | Scope.Scope
> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const tempDir = `${targetDir}/.framework-tmp`;
    const tarPath = `${tempDir}/release.tar.gz`;

    return yield* Effect.acquireRelease(
      Effect.gen(function* () {
        yield* fs.makeDirectory(tempDir, { recursive: true }).pipe(
          Effect.mapError(
            (cause) =>
              new ReleaseFsError({
                operation: 'makeDirectory',
                cause: toCauseString(cause),
              }),
          ),
        );

        const buffer = yield* HttpClient.followRedirects(http)
          .get(url, { headers: { 'User-Agent': 'ping-lf-cli' } })
          .pipe(
            Effect.flatMap(HttpClientResponse.filterStatusOk),
            Effect.flatMap((res) => res.arrayBuffer),
            Effect.mapError((cause) => new ReleaseNetworkError({ cause: toCauseString(cause) })),
          );

        yield* fs
          .writeFile(tarPath, new Uint8Array(buffer))
          .pipe(
            Effect.mapError(
              (cause) =>
                new ReleaseFsError({ operation: 'writeFile', cause: toCauseString(cause) }),
            ),
          );

        yield* Effect.tryPromise({
          try: () => extract({ file: tarPath, cwd: tempDir, strip: 1 }),
          catch: (cause) => new ReleaseParseError({ cause: toCauseString(cause) }),
        });

        return tempDir;
      }),
      (dir) => fs.remove(dir, { recursive: true }).pipe(Effect.ignore),
    );
  });

const buildGithubReleaseLayer = Layer.effect(
  Release,
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient;

    return {
      archiveUrl: (version: string) =>
        `https://github.com/${REPO}/archive/refs/tags/${version}.tar.gz`,

      resolveLatest: () =>
        http
          .get(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: API_HEADERS })
          .pipe(
            Effect.flatMap(HttpClientResponse.filterStatusOk),
            Effect.flatMap((res) => res.text),
            Effect.mapError((cause) => new ReleaseNetworkError({ cause: toCauseString(cause) })),
            Effect.flatMap((text) =>
              decodeLatestRelease(text).pipe(
                Effect.mapError((cause) => new ReleaseParseError({ cause: toCauseString(cause) })),
              ),
            ),
            Effect.map((data) => data.tag_name),
          ),

      listReleases: () =>
        http
          .get(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
            headers: API_HEADERS,
          })
          .pipe(
            Effect.flatMap(HttpClientResponse.filterStatusOk),
            Effect.flatMap((res) => res.text),
            Effect.mapError((cause) => new ReleaseNetworkError({ cause: toCauseString(cause) })),
            Effect.flatMap((json) => parseReleaseTags(json)),
            Effect.flatMap((releases) =>
              releases.length === 0
                ? Effect.fail(new ReleaseNotFoundError({ cause: 'No releases found on GitHub' }))
                : Effect.succeed(releases),
            ),
          ),

      fetch: (version: string, targetDir: string) =>
        Effect.gen(function* () {
          yield* validateVersion(version);
          const url = `https://github.com/${REPO}/archive/refs/tags/${version}.tar.gz`;
          return yield* downloadAndExtract(http, url, targetDir);
        }),

      fetchBranch: (branch: string, targetDir: string) => {
        const url = `https://github.com/${REPO}/archive/refs/heads/${branch}.tar.gz`;
        return downloadAndExtract(http, url, targetDir);
      },
    };
  }),
);

export const makeGithubReleaseLayer = (httpLayer: Layer.Layer<HttpClient.HttpClient>) =>
  buildGithubReleaseLayer.pipe(Layer.provide(httpLayer));

export const GithubReleaseLayer = makeGithubReleaseLayer(NodeHttpClient.layer);
