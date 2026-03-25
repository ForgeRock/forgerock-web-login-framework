import { Command, Options } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { Effect, Option } from "effect";
import { Release } from "../services/Release.js";
import { copyWithExclusions } from "../services/FileSystem.js";
import {
  scanUserDirectory,
  generateRegistrySource,
} from "../services/Registry.js";
import { readVersion, writeVersion } from "../config/version.js";
import { injectRegistryPluginAll } from "../services/ViteConfig.js";

const version = Options.text("version").pipe(
  Options.withAlias("v"),
  Options.withDescription(
    "Framework version to update to (e.g. v1.1.0). Defaults to latest release.",
  ),
  Options.optional,
);

const local = Options.directory("local").pipe(
  Options.withAlias("l"),
  Options.withDescription("Path to local framework source (skips GitHub fetch)."),
  Options.optional,
);

export const updateCommand = Command.make(
  "update",
  { version, local },
  ({ version: verOption, local: localOption }) =>
    Effect.gen(function* () {
      const p = yield* Path.Path;
      const release = yield* Release;
      const resolvedDir = p.resolve(".");
      const isLocal = Option.isSome(localOption);

      // 1. Read current version
      const current = yield* readVersion(resolvedDir);
      yield* Effect.log(`Current version: ${current.version}`);

      // 2. Resolve target version and source
      let sourceDir: string;
      let ver: string;

      if (isLocal) {
        sourceDir = p.resolve(localOption.value);
        ver = Option.isSome(verOption) ? verOption.value : "local";
        yield* Effect.log(`Updating from local source: ${sourceDir}`);
      } else {
        ver = Option.isSome(verOption)
          ? verOption.value
          : yield* Effect.tap(
              release.resolveLatest(),
              (v) =>
                Effect.log(`No --version specified, resolved latest: ${v}`),
            );

        // 3. Check if already up to date
        if (current.version === ver) {
          yield* Effect.log(`Already at version ${ver}. Nothing to update.`);
          return;
        }

        yield* Effect.log(`Updating from ${current.version} to ${ver}`);
        sourceDir = yield* release.fetch(ver, resolvedDir);
      }

      // 4. Overwrite framework files (preserves /user)
      yield* copyWithExclusions(sourceDir, resolvedDir);

      // 5. Re-inject Vite plugin (configs were overwritten by copyWithExclusions)
      yield* injectRegistryPluginAll(resolvedDir);

      // 6. Re-scan /user and regenerate registry
      const userDir = p.join(resolvedDir, "user");
      const components = scanUserDirectory(userDir);
      const registrySource = generateRegistrySource(components);

      const efs = yield* FileSystem.FileSystem;
      const registryPath = p.join(
        resolvedDir,
        "core/journey/_utilities/custom-registry.ts",
      );
      yield* efs.writeFileString(registryPath, registrySource);

      // 7. Update .generator-version
      yield* writeVersion(resolvedDir, {
        version: ver,
        commitHash: ver,
        generatedAt: new Date().toISOString(),
      });

      // 8. Cleanup temp directory (only when fetched from remote)
      if (!isLocal) {
        yield* efs
          .remove(sourceDir, { recursive: true })
          .pipe(Effect.catchAll(() => Effect.void));
      }

      yield* Effect.log(`Updated successfully to ${ver}`);
    }),
);
