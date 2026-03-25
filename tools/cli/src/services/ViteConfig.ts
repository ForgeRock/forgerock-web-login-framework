import { FileSystem, Path } from "@effect/platform";
import { Effect } from "effect";

/**
 * Patches a Vite config file to inject the customRegistryPlugin.
 * Adds the import and inserts the plugin call before the first existing plugin.
 * Idempotent — skips if already injected.
 */
export const injectRegistryPlugin = (configPath: string) =>
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
      content =
        content.slice(0, endOfLine + 1) +
        importLine +
        content.slice(endOfLine + 1);
    }

    // Insert plugin at the start of the plugins array
    content = content.replace(
      /plugins:\s*\[/,
      `plugins: [\n    customRegistryPlugin({ root: resolve('../..') }),`,
    );

    yield* efs.writeFileString(configPath, content);
  });

/**
 * Injects the custom registry Vite plugin into all Vite configs
 * in the target directory. Used by both generate and update commands.
 */
export const injectRegistryPluginAll = (resolvedDir: string) =>
  Effect.gen(function* () {
    const p = yield* Path.Path;
    yield* injectRegistryPlugin(
      p.join(resolvedDir, "packages/login-widget/vite.config.ts"),
    );
    yield* injectRegistryPlugin(
      p.join(resolvedDir, "packages/login-widget/vite.config.iife.ts"),
    );
    yield* injectRegistryPlugin(
      p.join(resolvedDir, "apps/login-app/vite.config.ts"),
    );
  });
