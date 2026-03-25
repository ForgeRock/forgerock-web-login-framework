import { Args, Command } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { Effect } from "effect";
import {
  scanUserDirectory,
  generateRegistrySource,
} from "../services/Registry.js";

const directory = Args.directory({ name: "directory" }).pipe(
  Args.withDefault("."),
);

export const scanCommand = Command.make("scan", { directory }, ({ directory }) =>
  Effect.gen(function* () {
    const p = yield* Path.Path;
    const efs = yield* FileSystem.FileSystem;
    const targetDir = p.resolve(directory);
    const userDir = p.join(targetDir, "user");

    const userExists = yield* efs.exists(userDir);
    if (!userExists) {
      yield* Effect.log("No /user directory found. Writing empty registry.");
      const registryPath = p.join(
        targetDir,
        "core/journey/_utilities/custom-registry.ts",
      );
      yield* efs.makeDirectory(p.dirname(registryPath), { recursive: true });
      yield* efs.writeFileString(registryPath, generateRegistrySource([]));
      return;
    }

    const components = scanUserDirectory(userDir);
    const registrySource = generateRegistrySource(components);
    const registryPath = p.join(
      targetDir,
      "core/journey/_utilities/custom-registry.ts",
    );
    yield* efs.makeDirectory(p.dirname(registryPath), { recursive: true });
    yield* efs.writeFileString(registryPath, registrySource);
    yield* Effect.log(
      `Registry updated: ${components.length} custom component(s)`,
    );
  }),
);
