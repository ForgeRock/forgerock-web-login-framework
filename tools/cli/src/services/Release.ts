import { Context, Effect, Layer } from "effect";
import { Command, CommandExecutor } from "@effect/platform";
import { ReleaseNotFoundError } from "../errors.js";

const REPO = "ForgeRock/forgerock-web-login-framework";

const VERSION_REGEX = /^v?\d+\.\d+\.\d+(-[\w.]+)?$/;

function validateVersion(
  version: string,
): Effect.Effect<string, ReleaseNotFoundError> {
  return VERSION_REGEX.test(version)
    ? Effect.succeed(version)
    : Effect.fail(
        new ReleaseNotFoundError({
          version,
          cause: `Invalid version format: "${version}". Expected semver like v1.0.0`,
        }),
      );
}

export class Release extends Context.Tag("Release")<
  Release,
  {
    readonly archiveUrl: (version: string) => string;
    readonly fetch: (
      version: string,
      targetDir: string,
    ) => Effect.Effect<
      string,
      ReleaseNotFoundError,
      CommandExecutor.CommandExecutor
    >;
  }
>() {}

export const ReleaseLive = Layer.succeed(Release, {
  archiveUrl: (version: string) =>
    `https://github.com/${REPO}/archive/refs/tags/${version}.tar.gz`,

  fetch: (version, targetDir) =>
    Effect.gen(function* () {
      yield* validateVersion(version);

      const url = `https://github.com/${REPO}/archive/refs/tags/${version}.tar.gz`;
      const tempDir = `${targetDir}/.framework-tmp`;

      yield* Command.make("mkdir", "-p", tempDir).pipe(
        Command.exitCode,
        Effect.mapError(
          (cause) => new ReleaseNotFoundError({ version, cause }),
        ),
      );

      yield* Command.make(
        "curl",
        "-sfL",
        "-o",
        `${tempDir}/release.tar.gz`,
        url,
      ).pipe(
        Command.exitCode,
        Effect.mapError(
          (cause) => new ReleaseNotFoundError({ version, cause }),
        ),
      );

      yield* Command.make(
        "tar",
        "xz",
        "-C",
        tempDir,
        "--strip-components=1",
        "-f",
        `${tempDir}/release.tar.gz`,
      ).pipe(
        Command.exitCode,
        Effect.mapError(
          (cause) => new ReleaseNotFoundError({ version, cause }),
        ),
      );

      return tempDir;
    }),
});
