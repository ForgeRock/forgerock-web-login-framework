import { Command, Options } from '@effect/cli';
import { Console, Effect } from 'effect';

import { assertValidProject, writeVersion } from '../config/version.js';
import { copyWithExclusions } from '../services/file-system.js';
import { runRegistryScript } from '../services/registry.js';
import { resolveSource } from './source.js';

export const updateCommand = Command.make(
  'update',
  {
    local: Options.optional(
      Options.text('local').pipe(
        Options.withDescription(
          'Path to a local framework directory. If omitted, the main branch is downloaded from GitHub.',
        ),
      ),
    ),
    version: Options.optional(
      Options.text('version').pipe(
        Options.withDescription(
          'Framework version tag to update to (e.g. v1.2.0). If omitted, the main branch is used.',
        ),
      ),
    ),
  },
  ({ local, version }) =>
    Effect.gen(function* () {
      const cwd = process.cwd();

      // ── 1. Verify this is an initialized project ──────────────────────────
      const currentVersion = yield* assertValidProject(cwd);

      yield* Console.log(`\nUpdating project from version: ${currentVersion.version}\n`);

      // ── 2. Resolve source + copy framework (scoped: temp dir auto-cleaned) ──
      // Effect.scoped closes the Scope that release.fetch opens, triggering
      // automatic removal of the .framework-tmp directory after copying.
      const resolvedVersion = yield* Effect.scoped(
        Effect.gen(function* () {
          const { sourceDir, resolvedVersion } = yield* resolveSource(local, version, cwd);
          yield* Console.log('Copying updated framework files...');
          yield* copyWithExclusions(sourceDir, cwd);
          return resolvedVersion;
        }),
      );

      // ── 3. Regenerate custom-registry.ts ──────────────────────────────────
      yield* Console.log('Regenerating custom component registry...');
      yield* runRegistryScript(cwd);

      // ── 4. Update .generator-version ──────────────────────────────────────
      yield* writeVersion(cwd, {
        version: resolvedVersion,
        commitHash: '',
        generatedAt: new Date().toISOString(),
      });
      yield* Console.log(
        `\nDone. Updated from ${currentVersion.version} to ${resolvedVersion}.\n` +
          'Custom component registry regenerated.\n' +
          'Run "pnpm install" if package dependencies changed.\n',
      );
    }),
).pipe(
  Command.withDescription(
    'Fetch the latest (or a specified) framework version and overwrite core files while preserving experimental/custom/.',
  ),
);
