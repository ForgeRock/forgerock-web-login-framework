import { Command, Args, Options } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { Effect, Option } from "effect";
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

const resolveTemplateDir = Effect.gen(function* () {
  const p = yield* Path.Path;
  const efs = yield* FileSystem.FileSystem;
  const base = yield* p.fromFileUrl(new URL(import.meta.url));
  const baseDir = p.dirname(base);
  // In dist: dist/commands/ -> ../templates = dist/templates/
  const distPath = p.resolve(baseDir, "../templates");
  const distUserExists = yield* efs.exists(p.join(distPath, "user"));
  if (distUserExists) return distPath;
  // In source (vitest): src/commands/ -> ../../templates = templates/
  return p.resolve(baseDir, "../../templates");
});

export const scaffoldUserDirectory = (targetDir: string) =>
  Effect.gen(function* () {
    const p = yield* Path.Path;
    const efs = yield* FileSystem.FileSystem;
    const userDir = p.join(targetDir, "user");
    const callbackDir = p.join(userDir, "callback");
    const stageDir = p.join(userDir, "stage");

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

    const demoCallbackDir = p.join(callbackDir, "demo-callback");
    const demoStageDir = p.join(stageDir, "demo-stage");

    const templateDir = yield* resolveTemplateDir;

    const callbackExists = yield* efs.exists(demoCallbackDir);
    if (!callbackExists) {
      yield* copyTemplateDir(
        p.join(templateDir, "user/callback/demo-callback"),
        demoCallbackDir,
      );
    }

    const stageExists = yield* efs.exists(demoStageDir);
    if (!stageExists) {
      yield* copyTemplateDir(
        p.join(templateDir, "user/stage/demo-stage"),
        demoStageDir,
      );
    }
  });

const copyTemplateDir = (sourceDir: string, targetDir: string) =>
  Effect.gen(function* () {
    const p = yield* Path.Path;
    const efs = yield* FileSystem.FileSystem;

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
    const sourceExists = yield* efs.exists(sourceDir);
    if (!sourceExists) {
      return;
    }

    const entries = yield* efs.readDirectory(sourceDir);
    for (const entry of entries) {
      const srcPath = p.join(sourceDir, entry);
      const destPath = p.join(targetDir, entry);
      const info = yield* efs.stat(srcPath);

      if (info.type === "File") {
        const content = yield* efs.readFileString(srcPath);
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
    const p = yield* Path.Path;
    const efs = yield* FileSystem.FileSystem;
    const workflowDir = p.join(targetDir, ".github", "workflows");

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

    const ciPath = p.join(workflowDir, "ci.yml");
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
    const p = yield* Path.Path;
    const efs = yield* FileSystem.FileSystem;
    const envPath = p.join(targetDir, ".env.example");

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
      const p = yield* Path.Path;
      const release = yield* Release;
      const resolvedDir = p.resolve(targetDir);

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
      const userDir = p.join(resolvedDir, "user");
      const components = scanUserDirectory(userDir);
      const registrySource = generateRegistrySource(components);

      const efs = yield* FileSystem.FileSystem;
      const registryPath = p.join(userDir, "registry.ts");
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
