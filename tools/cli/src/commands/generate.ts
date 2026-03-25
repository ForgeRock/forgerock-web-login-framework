import { Command, Args, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { Effect, Option } from "effect";
import path from "node:path";
import fs from "node:fs";
import { Release } from "../services/Release.js";
import { copyWithExclusions } from "../services/FileSystem.js";
import {
  scanUserDirectory,
  generateRegistrySource,
} from "../services/Registry.js";
import { writeVersion } from "../config/version.js";
import { generateCiWorkflow } from "../templates/ci-workflow.js";
import { generateEnvExample } from "../templates/env-example.js";
import { FileSystemError } from "../errors.js";

function resolveTemplateDir(): string {
  const base = path.dirname(new URL(import.meta.url).pathname);
  // In dist: dist/commands/ -> ../templates = dist/templates/
  const distPath = path.resolve(base, "../templates");
  if (fs.existsSync(path.join(distPath, "user"))) return distPath;
  // In source (vitest): src/commands/ -> ../../templates = templates/
  const srcPath = path.resolve(base, "../../templates");
  return srcPath;
}

const templateDir = resolveTemplateDir();

export const scaffoldUserDirectory = (targetDir: string) =>
  Effect.gen(function* () {
    const efs = yield* FileSystem.FileSystem;
    const userDir = path.join(targetDir, "user");
    const callbackDir = path.join(userDir, "callback");
    const stageDir = path.join(userDir, "stage");

    yield* efs
      .makeDirectory(callbackDir, { recursive: true })
      .pipe(
        Effect.mapError(
          (cause) =>
            new FileSystemError({
              operation: "makeDirectory",
              path: callbackDir,
              cause,
            }),
        ),
      );

    yield* efs
      .makeDirectory(stageDir, { recursive: true })
      .pipe(
        Effect.mapError(
          (cause) =>
            new FileSystemError({
              operation: "makeDirectory",
              path: stageDir,
              cause,
            }),
        ),
      );

    const demoCallbackDir = path.join(callbackDir, "demo-callback");
    const demoStageDir = path.join(stageDir, "demo-stage");

    const callbackExists = yield* efs.exists(demoCallbackDir);
    if (!callbackExists) {
      yield* copyTemplateDir(
        efs,
        path.join(templateDir, "user/callback/demo-callback"),
        demoCallbackDir,
      );
    }

    const stageExists = yield* efs.exists(demoStageDir);
    if (!stageExists) {
      yield* copyTemplateDir(
        efs,
        path.join(templateDir, "user/stage/demo-stage"),
        demoStageDir,
      );
    }
  });

const copyTemplateDir = (
  efs: FileSystem.FileSystem,
  sourceDir: string,
  targetDir: string,
) =>
  Effect.gen(function* () {
    yield* efs
      .makeDirectory(targetDir, { recursive: true })
      .pipe(
        Effect.mapError(
          (cause) =>
            new FileSystemError({
              operation: "makeDirectory",
              path: targetDir,
              cause,
            }),
        ),
      );

    // Read from the on-disk template directory (copied during build)
    if (!fs.existsSync(sourceDir)) {
      return;
    }

    const entries = fs.readdirSync(sourceDir);
    for (const entry of entries) {
      const srcPath = path.join(sourceDir, entry);
      const destPath = path.join(targetDir, entry);
      const stat = fs.statSync(srcPath);

      if (stat.isFile()) {
        const content = fs.readFileSync(srcPath, "utf-8");
        yield* efs.writeFileString(destPath, content).pipe(
          Effect.mapError(
            (cause) =>
              new FileSystemError({
                operation: "writeFile",
                path: destPath,
                cause,
              }),
          ),
        );
      }
    }
  });

export const scaffoldCi = (targetDir: string) =>
  Effect.gen(function* () {
    const efs = yield* FileSystem.FileSystem;
    const workflowDir = path.join(targetDir, ".github", "workflows");

    yield* efs
      .makeDirectory(workflowDir, { recursive: true })
      .pipe(
        Effect.mapError(
          (cause) =>
            new FileSystemError({
              operation: "makeDirectory",
              path: workflowDir,
              cause,
            }),
        ),
      );

    const ciPath = path.join(workflowDir, "ci.yml");
    yield* efs.writeFileString(ciPath, generateCiWorkflow()).pipe(
      Effect.mapError(
        (cause) =>
          new FileSystemError({
            operation: "writeFile",
            path: ciPath,
            cause,
          }),
      ),
    );
  });

export const scaffoldEnvExample = (targetDir: string) =>
  Effect.gen(function* () {
    const efs = yield* FileSystem.FileSystem;
    const envPath = path.join(targetDir, ".env.example");

    const exists = yield* efs.exists(envPath);
    if (!exists) {
      yield* efs.writeFileString(envPath, generateEnvExample()).pipe(
        Effect.mapError(
          (cause) =>
            new FileSystemError({
              operation: "writeFile",
              path: envPath,
              cause,
            }),
        ),
      );
    }
  });

const directory = Args.directory({ name: "directory" }).pipe(
  Args.withDefault("."),
);

const version = Options.text("version").pipe(
  Options.withAlias("v"),
  Options.withDescription("Framework version (e.g. v1.0.0). Defaults to latest release."),
  Options.optional,
);

export const generateCommand = Command.make(
  "generate",
  { directory, version },
  ({ directory: targetDir, version: verOption }) =>
    Effect.gen(function* () {
      const release = yield* Release;
      const resolvedDir = path.resolve(targetDir);

      const ver = Option.isSome(verOption)
        ? verOption.value
        : yield* Effect.tap(
            release.resolveLatest(),
            (v) => Effect.log(`No --version specified, resolved latest: ${v}`),
          );

      yield* Effect.log(`Generating project at ${resolvedDir} from ${ver}`);

      // 1. Fetch release archive
      const tempDir = yield* release.fetch(ver, resolvedDir);

      // 2. Copy framework files (excludes user/, .github/, etc.)
      yield* copyWithExclusions(tempDir, resolvedDir);

      // 3. Scaffold user directory with demo components
      yield* scaffoldUserDirectory(resolvedDir);

      // 4. Scaffold CI workflow
      yield* scaffoldCi(resolvedDir);

      // 5. Scaffold .env.example
      yield* scaffoldEnvExample(resolvedDir);

      // 6. Scan user directory and generate registry
      const userDir = path.join(resolvedDir, "user");
      const components = scanUserDirectory(userDir);
      const registrySource = generateRegistrySource(components);

      const efs = yield* FileSystem.FileSystem;
      const registryPath = path.join(userDir, "registry.ts");
      yield* efs.writeFileString(registryPath, registrySource);

      // 7. Write version file
      yield* writeVersion(resolvedDir, {
        version: ver,
        commitHash: "generated",
        generatedAt: new Date().toISOString(),
      });

      // 8. Cleanup temp directory
      yield* efs
        .remove(tempDir, { recursive: true })
        .pipe(Effect.catchAll(() => Effect.void));

      yield* Effect.log(`Project generated successfully at ${resolvedDir}`);
    }),
);
