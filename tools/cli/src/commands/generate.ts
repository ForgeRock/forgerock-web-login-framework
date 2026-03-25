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

    // Write a tsconfig for the user directory so esbuild resolves types
    // locally instead of crawling up to the root project references
    const tsconfigPath = p.join(userDir, "tsconfig.json");
    const tsconfigExists = yield* efs.exists(tsconfigPath);
    if (!tsconfigExists) {
      yield* efs.writeFileString(
        tsconfigPath,
        JSON.stringify(
          {
            compilerOptions: {
              target: "ESNext",
              module: "ESNext",
              moduleResolution: "bundler",
              strict: true,
              verbatimModuleSyntax: true,
              isolatedModules: true,
              esModuleInterop: true,
              skipLibCheck: true,
              lib: ["ESNext", "DOM", "DOM.Iterable"],
              paths: {
                $core: ["../core"],
                "$core/*": ["../core/*"],
                $components: ["../core/components"],
                "$components/*": ["../core/components/*"],
                $journey: ["../core/journey"],
                "$journey/*": ["../core/journey/*"],
                $locales: ["../core/locales"],
                "$locales/*": ["../core/locales/*"],
              },
            },
            include: ["**/*.ts", "**/*.svelte"],
          },
          null,
          2,
        ) + "\n",
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

const local = Options.directory("local").pipe(
  Options.withAlias("l"),
  Options.withDescription("Path to local framework source (skips GitHub fetch)."),
  Options.optional,
);

/**
 * Patches a Vite config file to inject the customRegistryPlugin.
 * Adds the import and inserts the plugin call before the first existing plugin.
 */
const injectRegistryPlugin = (configPath: string) =>
  Effect.gen(function* () {
    const efs = yield* FileSystem.FileSystem;
    const exists = yield* efs.exists(configPath);
    if (!exists) return;

    let content = yield* efs.readFileString(configPath);

    // Skip if already injected
    if (content.includes("customRegistryPlugin")) return;

    // Add import after the last existing import
    const importLine = `import { customRegistryPlugin } from '../../core/_utilities/vite-plugin-custom-registry';\n`;
    const lastImportIdx = content.lastIndexOf("\nimport ");
    if (lastImportIdx !== -1) {
      const endOfLine = content.indexOf("\n", lastImportIdx + 1);
      content = content.slice(0, endOfLine + 1) + importLine + content.slice(endOfLine + 1);
    }

    // Insert plugin at the start of the plugins array
    content = content.replace(
      /plugins:\s*\[/,
      `plugins: [\n    customRegistryPlugin({ root: resolve('../..') }),`,
    );

    yield* efs.writeFileString(configPath, content);
  });

export const generateCommand = Command.make(
  "generate",
  { directory, version, local },
  ({ directory: targetDir, version: verOption, local: localOption }) =>
    Effect.gen(function* () {
      const p = yield* Path.Path;
      const release = yield* Release;
      const resolvedDir = p.resolve(targetDir);
      const isLocal = Option.isSome(localOption);

      // Determine source: local path or fetched release
      let sourceDir: string;
      let ver: string;

      if (isLocal) {
        sourceDir = p.resolve(localOption.value);
        ver = Option.isSome(verOption) ? verOption.value : "local";
        yield* Effect.log(`Generating project at ${resolvedDir} from local source: ${sourceDir}`);
      } else {
        ver = Option.isSome(verOption)
          ? verOption.value
          : yield* Effect.tap(
              release.resolveLatest(),
              (v) => Effect.log(`No --version specified, resolved latest: ${v}`),
            );
        yield* Effect.log(`Generating project at ${resolvedDir} from ${ver}`);
        sourceDir = yield* release.fetch(ver, resolvedDir);
      }

      // 1. Copy framework files (excludes user/, .github/, tools/, pnpm-workspace.yaml, etc.)
      yield* copyWithExclusions(sourceDir, resolvedDir);

      // 2. Write a clean pnpm-workspace.yaml (without tools/*)
      const efs = yield* FileSystem.FileSystem;
      yield* efs.writeFileString(
        p.join(resolvedDir, "pnpm-workspace.yaml"),
        [
          "packages:",
          "  - 'packages/*'",
          "  - 'apps/*'",
          "  - 'e2e'",
          "",
          "overrides:",
          "  vite>rollup: 'npm:@rollup/wasm-node'",
          "",
        ].join("\n"),
      );

      // 2b. Write root tsconfig.json without apps/login-app reference
      // (apps/login-app/tsconfig.json extends .svelte-kit/tsconfig.json
      //  which only exists after svelte-kit sync runs via pnpm install)
      yield* efs.writeFileString(
        p.join(resolvedDir, "tsconfig.json"),
        JSON.stringify(
          {
            compilerOptions: {
              target: "ESNext",
              module: "ESNext",
              moduleResolution: "bundler",
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true,
              lib: ["ESNext", "DOM", "DOM.Iterable"],
            },
            references: [{ path: "core" }, { path: "packages/login-widget" }],
            exclude: ["node_modules", "packages", "apps", "e2e", "core"],
          },
          null,
          2,
        ) + "\n",
      );

      // 3. Scaffold user directory with demo components
      yield* scaffoldUserDirectory(resolvedDir);

      // 4. Scaffold CI workflow
      yield* scaffoldCi(resolvedDir);

      // 5. Scaffold .env.example
      yield* scaffoldEnvExample(resolvedDir);

      // 6. Inject custom registry Vite plugin into configs
      yield* Effect.log("Injecting custom registry Vite plugin...");
      yield* injectRegistryPlugin(p.join(resolvedDir, "packages/login-widget/vite.config.ts"));
      yield* injectRegistryPlugin(p.join(resolvedDir, "packages/login-widget/vite.config.iife.ts"));
      yield* injectRegistryPlugin(p.join(resolvedDir, "apps/login-app/vite.config.ts"));

      // 7. Scan user directory and generate initial registry
      const userDir = p.join(resolvedDir, "user");
      const components = scanUserDirectory(userDir);
      const registrySource = generateRegistrySource(components);

      const registryPath = p.join(resolvedDir, "core/journey/_utilities/custom-registry.ts");
      yield* efs.makeDirectory(p.dirname(registryPath), { recursive: true }).pipe(
        Effect.catchAll(() => Effect.void),
      );
      yield* efs.writeFileString(registryPath, registrySource);

      // 8. Write version file
      yield* writeVersion(resolvedDir, {
        version: ver,
        commitHash: "generated",
        generatedAt: new Date().toISOString(),
      });

      // 9. Cleanup temp directory (only when fetched from remote)
      if (!isLocal) {
        yield* efs
          .remove(sourceDir, { recursive: true })
          .pipe(Effect.catchAll(() => Effect.void));
      }

      yield* Effect.log(`Project generated successfully at ${resolvedDir}`);
      yield* Effect.log("Next steps:");
      yield* Effect.log(`  cd ${resolvedDir}`);
      yield* Effect.log("  pnpm install");
      yield* Effect.log("  cp .env.example .env  # fill in your AM details");
      yield* Effect.log("  pnpm dev");
    }),
);
