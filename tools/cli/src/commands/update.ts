import { Command, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { Effect } from "effect";
import path from "node:path";
import { Release } from "../services/Release.js";
import { copyWithExclusions } from "../services/FileSystem.js";
import {
  scanUserDirectory,
  generateRegistrySource,
} from "../services/Registry.js";
import { readVersion, writeVersion } from "../config/version.js";

const version = Options.text("version").pipe(Options.withAlias("v"));

export const updateCommand = Command.make(
  "update",
  { version },
  ({ version: ver }) =>
    Effect.gen(function* () {
      const release = yield* Release;
      const resolvedDir = path.resolve(".");

      // 1. Read current version
      const current = yield* readVersion(resolvedDir);
      yield* Effect.log(`Current version: ${current.version}`);

      // 2. Check if already up to date
      if (current.version === ver) {
        yield* Effect.log(`Already at version ${ver}. Nothing to update.`);
        return;
      }

      yield* Effect.log(`Updating from ${current.version} to ${ver}`);

      // 3. Fetch new release archive
      const tempDir = yield* release.fetch(ver, resolvedDir);

      // 4. Overwrite framework files (preserves /user)
      yield* copyWithExclusions(tempDir, resolvedDir);

      // 5. Re-scan /user and regenerate registry
      const userDir = path.join(resolvedDir, "user");
      const components = scanUserDirectory(userDir);
      const registrySource = generateRegistrySource(components);

      const efs = yield* FileSystem.FileSystem;
      const registryPath = path.join(userDir, "registry.ts");
      yield* efs.writeFileString(registryPath, registrySource);

      // 6. Update .generator-version
      yield* writeVersion(resolvedDir, {
        version: ver,
        commitHash: ver,
        generatedAt: new Date().toISOString(),
      });

      // 7. Cleanup temp directory
      yield* efs
        .remove(tempDir, { recursive: true })
        .pipe(Effect.catchAll(() => Effect.void));

      yield* Effect.log(`Updated successfully to ${ver}`);
    }),
);
