import { Args, Command } from "@effect/cli";
import { Effect } from "effect";
import fs from "node:fs";
import path from "node:path";
import {
  scanUserDirectory,
  generateRegistrySource,
} from "../services/Registry.js";

const directory = Args.directory({ name: "directory" }).pipe(
  Args.withDefault("."),
);

export const scanCommand = Command.make("scan", { directory }, ({ directory }) =>
  Effect.gen(function* () {
    const targetDir = path.resolve(directory);
    const userDir = path.join(targetDir, "user");

    if (!fs.existsSync(userDir)) {
      yield* Effect.log("No /user directory found. Writing empty registry.");
      const registryPath = path.join(
        targetDir,
        "core/journey/_utilities/custom-registry.ts",
      );
      fs.mkdirSync(path.dirname(registryPath), { recursive: true });
      fs.writeFileSync(registryPath, generateRegistrySource([]));
      return;
    }

    const components = scanUserDirectory(userDir);
    const registrySource = generateRegistrySource(components);
    const registryPath = path.join(
      targetDir,
      "core/journey/_utilities/custom-registry.ts",
    );
    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(registryPath, registrySource);
    yield* Effect.log(
      `Registry updated: ${components.length} custom component(s)`,
    );
  }),
);
